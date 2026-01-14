'use client';

import { BaseModel } from '@/lib/BaseModel';
import { firestoreApi } from '@/lib/FirestoreApi';
import { where } from 'firebase/firestore';

export type DepreciationMethod = 'straight_line';

export interface DepreciationRunResult {
    year: number;
    runId: string;
    processedCount: number;
    skippedCount: number;
    errorCount: number;
    totalDepreciation: number;
    errors: Array<{ assetId: string; assetTag: string; message: string }>;
}

export interface DepreciationPreviewResult {
    year: number;
    candidateCount: number;
    skippedCount: number;
    errorCount: number;
    totalDepreciation: number;
    errors: Array<{ assetId: string; assetTag: string; message: string }>;
}

function safeNumber(value: unknown, fallback: number = 0): number {
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function normalizeMethod(method: unknown): DepreciationMethod | null {
    const m = (typeof method === 'string' ? method : '').trim().toLowerCase();
    if (!m) return null;
    if (m === 'straight_line' || m === 'خطي' || m === 'line' || m === 'linear') return 'straight_line';
    return null;
}

function getYearFromIso(dateIso: string): number | null {
    if (!dateIso) return null;
    const d = new Date(dateIso);
    if (Number.isNaN(d.getTime())) return null;
    return d.getFullYear();
}

export class DepreciationService {
    private static instance: DepreciationService;

    static getInstance(): DepreciationService {
        if (!DepreciationService.instance) {
            DepreciationService.instance = new DepreciationService();
        }
        return DepreciationService.instance;
    }

    private constructor() { }

    calculateAnnualDepreciation(params: {
        purchaseValue: number;
        residualValue: number;
        usefulLifeYears: number;
    }): number {
        const purchaseValue = safeNumber(params.purchaseValue);
        const residualValue = safeNumber(params.residualValue);
        const usefulLifeYears = safeNumber(params.usefulLifeYears);

        if (usefulLifeYears <= 0) return 0;
        const base = Math.max(0, purchaseValue - residualValue);
        const annual = base / usefulLifeYears;
        return Number.isFinite(annual) ? annual : 0;
    }

    async previewStraightLineForYear(year: number): Promise<DepreciationPreviewResult> {
        const result: DepreciationPreviewResult = {
            year,
            candidateCount: 0,
            skippedCount: 0,
            errorCount: 0,
            totalDepreciation: 0,
            errors: [],
        };

        const assetsDocs = await firestoreApi.getDocuments(firestoreApi.getCollection('assets'));
        const assets = BaseModel.fromFirestoreArray(assetsDocs);

        const txDocsForYear = await firestoreApi.getDocuments(firestoreApi.getCollection('depreciationTransactions'), {
            constraints: [where('year', '==', year)],
        });
        const alreadyDepreciatedAssetIds = new Set<string>();
        for (const doc of txDocsForYear) {
            const data = doc.data();
            const assetId = (data?.asset_id || '').toString().trim();
            if (assetId) {
                alreadyDepreciatedAssetIds.add(assetId);
            }
        }

        for (const asset of assets) {
            const assetId = asset.get('id');
            const assetTag = asset.get('asset_tag') || assetId;

            if (!assetId) {
                result.skippedCount++;
                continue;
            }

            try {
                const isActive = asset.getValue<number>('is_active') === 1 || asset.getValue<boolean>('is_active') === true;
                if (!isActive) {
                    result.skippedCount++;
                    continue;
                }

                const depreciationEnabled =
                    asset.getValue<number>('depreciation_enabled') === 1 || asset.getValue<boolean>('depreciation_enabled') === true;
                if (!depreciationEnabled) {
                    result.skippedCount++;
                    continue;
                }

                const method = normalizeMethod(asset.get('depreciation_method'));
                if (method !== 'straight_line') {
                    result.skippedCount++;
                    continue;
                }

                const startUseDate = asset.get('start_use_date');
                const startYear = getYearFromIso(startUseDate);
                if (!startYear || year < startYear) {
                    result.skippedCount++;
                    continue;
                }

                const lastYear = safeNumber(asset.getValue<number>('last_depreciation_year'), 0);
                if (lastYear && year <= lastYear) {
                    result.skippedCount++;
                    continue;
                }

                if (alreadyDepreciatedAssetIds.has(assetId)) {
                    result.skippedCount++;
                    continue;
                }

                const purchaseValue = safeNumber(asset.getValue<number>('purchase_value'), 0);
                const residualValue = safeNumber(asset.getValue<number>('residual_value'), 0);
                const usefulLifeYears = safeNumber(asset.getValue<number>('expected_lifetime_years'), 0);

                if (purchaseValue <= 0 || usefulLifeYears <= 0) {
                    result.skippedCount++;
                    continue;
                }

                const annualStored = safeNumber(asset.getValue<number>('annual_depreciation'), 0);
                const annual = annualStored > 0 ? annualStored : this.calculateAnnualDepreciation({
                    purchaseValue,
                    residualValue,
                    usefulLifeYears,
                });

                const accumulatedBefore = safeNumber(asset.getValue<number>('accumulated_depreciation'), 0);
                const bookValueBeforeRaw = safeNumber(asset.getValue<number>('book_value'), 0);
                const bookValueBefore = bookValueBeforeRaw > 0 ? bookValueBeforeRaw : Math.max(0, purchaseValue - accumulatedBefore);

                if (bookValueBefore <= residualValue) {
                    result.skippedCount++;
                    continue;
                }

                const maxAllowed = Math.max(0, bookValueBefore - residualValue);
                const depreciationAmount = Math.min(annual, maxAllowed);
                if (depreciationAmount <= 0) {
                    result.skippedCount++;
                    continue;
                }

                result.candidateCount++;
                result.totalDepreciation += depreciationAmount;
            } catch (e) {
                result.errorCount++;
                result.errors.push({
                    assetId,
                    assetTag,
                    message: e instanceof Error ? e.message : 'Unknown error',
                });
            }
        }

        return result;
    }

    async runStraightLineForYear(year: number): Promise<DepreciationRunResult> {
        const runId = firestoreApi.getNewId('depreciationRuns');

        const result: DepreciationRunResult = {
            year,
            runId,
            processedCount: 0,
            skippedCount: 0,
            errorCount: 0,
            totalDepreciation: 0,
            errors: [],
        };

        const assetsDocs = await firestoreApi.getDocuments(firestoreApi.getCollection('assets'));
        const assets = BaseModel.fromFirestoreArray(assetsDocs);

        const txDocsForYear = await firestoreApi.getDocuments(firestoreApi.getCollection('depreciationTransactions'), {
            constraints: [where('year', '==', year)],
        });
        const alreadyDepreciatedAssetIds = new Set<string>();
        for (const doc of txDocsForYear) {
            const data = doc.data();
            const assetId = (data?.asset_id || '').toString().trim();
            if (assetId) {
                alreadyDepreciatedAssetIds.add(assetId);
            }
        }

        for (const asset of assets) {
            const assetId = asset.get('id');
            const assetTag = asset.get('asset_tag') || assetId;

            if (!assetId) {
                result.skippedCount++;
                continue;
            }

            try {
                const isActive = asset.getValue<number>('is_active') === 1 || asset.getValue<boolean>('is_active') === true;
                if (!isActive) {
                    result.skippedCount++;
                    continue;
                }

                const depreciationEnabled =
                    asset.getValue<number>('depreciation_enabled') === 1 || asset.getValue<boolean>('depreciation_enabled') === true;
                if (!depreciationEnabled) {
                    result.skippedCount++;
                    continue;
                }

                const method = normalizeMethod(asset.get('depreciation_method'));
                if (method !== 'straight_line') {
                    result.skippedCount++;
                    continue;
                }

                const startUseDate = asset.get('start_use_date');
                const startYear = getYearFromIso(startUseDate);
                if (!startYear || year < startYear) {
                    result.skippedCount++;
                    continue;
                }

                const lastYear = safeNumber(asset.getValue<number>('last_depreciation_year'), 0);
                if (lastYear && year <= lastYear) {
                    result.skippedCount++;
                    continue;
                }

                if (alreadyDepreciatedAssetIds.has(assetId)) {
                    result.skippedCount++;
                    continue;
                }

                const purchaseValue = safeNumber(asset.getValue<number>('purchase_value'), 0);
                const residualValue = safeNumber(asset.getValue<number>('residual_value'), 0);
                const usefulLifeYears = safeNumber(asset.getValue<number>('expected_lifetime_years'), 0);

                if (purchaseValue <= 0 || usefulLifeYears <= 0) {
                    result.skippedCount++;
                    continue;
                }

                const annualStored = safeNumber(asset.getValue<number>('annual_depreciation'), 0);
                const annual = annualStored > 0 ? annualStored : this.calculateAnnualDepreciation({
                    purchaseValue,
                    residualValue,
                    usefulLifeYears,
                });

                const accumulatedBefore = safeNumber(asset.getValue<number>('accumulated_depreciation'), 0);
                const bookValueBeforeRaw = safeNumber(asset.getValue<number>('book_value'), 0);
                const bookValueBefore = bookValueBeforeRaw > 0 ? bookValueBeforeRaw : Math.max(0, purchaseValue - accumulatedBefore);

                if (bookValueBefore <= residualValue) {
                    result.skippedCount++;
                    continue;
                }

                const maxAllowed = Math.max(0, bookValueBefore - residualValue);
                const depreciationAmount = Math.min(annual, maxAllowed);
                if (depreciationAmount <= 0) {
                    result.skippedCount++;
                    continue;
                }

                const accumulatedAfter = accumulatedBefore + depreciationAmount;
                const bookValueAfter = Math.max(residualValue, bookValueBefore - depreciationAmount);

                const txId = firestoreApi.getNewId('depreciationTransactions');
                const txDocRef = firestoreApi.getDocument('depreciationTransactions', txId);
                await firestoreApi.setData(txDocRef, {
                    asset_id: assetId,
                    year,
                    depreciation_amount: depreciationAmount,
                    accumulated_before: accumulatedBefore,
                    accumulated_after: accumulatedAfter,
                    book_value_before: bookValueBefore,
                    book_value_after: bookValueAfter,
                    method,
                    run_id: runId,
                });

                alreadyDepreciatedAssetIds.add(assetId);

                const status = bookValueAfter <= residualValue ? 'fully_depreciated' : 'active';

                const assetDocRef = firestoreApi.getDocument('assets', assetId);
                await firestoreApi.updateData(assetDocRef, {
                    annual_depreciation: annual,
                    accumulated_depreciation: accumulatedAfter,
                    book_value: bookValueAfter,
                    last_depreciation_year: year,
                    depreciation_status: status,
                });

                result.processedCount++;
                result.totalDepreciation += depreciationAmount;
            } catch (e) {
                result.errorCount++;
                result.errors.push({
                    assetId,
                    assetTag,
                    message: e instanceof Error ? e.message : 'Unknown error',
                });
            }
        }

        const runDocRef = firestoreApi.getDocument('depreciationRuns', runId);
        await firestoreApi.setData(runDocRef, {
            year,
            processed_count: result.processedCount,
            skipped_count: result.skippedCount,
            error_count: result.errorCount,
            total_depreciation: result.totalDepreciation,
            status: 'completed',
        });

        return result;
    }
}

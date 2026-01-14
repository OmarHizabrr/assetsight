'use client';

import { ProtectedRoute, usePermissions } from '@/components/auth/ProtectedRoute';
import { MaterialIcon } from '@/components/icons/MaterialIcon';
import { AdminPageHeader } from '@/components/layout/AdminPageHeader';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/contexts/ToastContext';
import { BaseModel } from '@/lib/BaseModel';
import { firestoreApi } from '@/lib/FirestoreApi';
import { DepreciationService, type DepreciationPreviewResult, type DepreciationRunResult } from '@/lib/services/DepreciationService';
import { limit, orderBy } from 'firebase/firestore';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

function DepreciationPageContent() {
    const pathname = usePathname();
    const { canEdit } = usePermissions(pathname || '/admin/depreciation');
    const { showSuccess, showError, showWarning } = useToast();

    const currentYear = useMemo(() => new Date().getFullYear(), []);
    const [year, setYear] = useState<number>(currentYear);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<DepreciationRunResult | null>(null);
    const [preview, setPreview] = useState<DepreciationPreviewResult | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [recentRuns, setRecentRuns] = useState<BaseModel[]>([]);

    const loadRecentRuns = async () => {
        try {
            const docs = await firestoreApi.getDocuments(firestoreApi.getCollection('depreciationRuns'), {
                constraints: [orderBy('createTimes', 'desc'), limit(5)],
            });
            setRecentRuns(BaseModel.fromFirestoreArray(docs));
        } catch (e) {
            setRecentRuns([]);
        }
    };

    useEffect(() => {
        loadRecentRuns();
    }, []);

    const validateYear = (): boolean => {
        if (!year || year < 1900 || year > 3000) {
            showWarning('الرجاء إدخال سنة صحيحة');
            return false;
        }
        return true;
    };

    const doPreview = async () => {
        if (!canEdit) {
            showWarning('ليس لديك صلاحية تنفيذ الإهلاك');
            return;
        }
        if (!validateYear()) return;

        try {
            setPreviewLoading(true);
            setPreview(null);
            setResult(null);
            const service = DepreciationService.getInstance();
            const res = await service.previewStraightLineForYear(year);
            setPreview(res);
            showSuccess(`تمت المعاينة لسنة ${year}`);
        } catch (e) {
            console.error(e);
            showError('حدث خطأ أثناء المعاينة');
        } finally {
            setPreviewLoading(false);
        }
    };

    const run = async () => {
        if (!canEdit) {
            showWarning('ليس لديك صلاحية تنفيذ الإهلاك');
            return;
        }

        if (!validateYear()) return;

        if (!preview || preview.year !== year) {
            showWarning('الرجاء عمل معاينة (Dry Run) أولاً قبل التنفيذ');
            return;
        }

        setConfirmOpen(true);
    };

    const confirmRun = async () => {
        if (!preview || preview.year !== year) {
            setConfirmOpen(false);
            return;
        }

        try {
            setLoading(true);
            setResult(null);
            const service = DepreciationService.getInstance();
            const res = await service.runStraightLineForYear(year);
            setResult(res);
            showSuccess(`تم تنفيذ الإهلاك لسنة ${year}`);
            loadRecentRuns();
        } catch (e) {
            console.error(e);
            showError('حدث خطأ أثناء تنفيذ الإهلاك');
        } finally {
            setLoading(false);
            setConfirmOpen(false);
        }
    };

    return (
        <ProtectedRoute>
            <MainLayout>
                <div className="container mx-auto px-4 py-6 max-w-7xl">
                    <AdminPageHeader
                        title="الإهلاك السنوي"
                        subtitle="تنفيذ الإهلاك بالقسط الثابت للأصول المفعّل عليها الإهلاك"
                        iconName="calendar_month"
                        className="mb-6"
                    />

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <MaterialIcon name="play_circle" className="text-slate-600 dark:text-slate-300" size="md" />
                                <span className="font-bold">تشغيل الإهلاك</span>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                                <Input
                                    label="السنة"
                                    type="number"
                                    value={year}
                                    onChange={(e) => setYear(parseInt(e.target.value) || currentYear)}
                                    fullWidth={false}
                                />
                                <div className="sm:col-span-2 flex gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        isLoading={previewLoading}
                                        onClick={doPreview}
                                        leftIcon={<MaterialIcon name="visibility" className="text-primary-600" size="sm" />}
                                    >
                                        معاينة (Dry Run)
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="primary"
                                        isLoading={loading}
                                        onClick={run}
                                        leftIcon={<MaterialIcon name="play_arrow" className="text-white" size="sm" />}
                                    >
                                        تنفيذ الإهلاك
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setYear(currentYear)}
                                        leftIcon={<MaterialIcon name="today" className="text-primary-600" size="sm" />}
                                    >
                                        السنة الحالية
                                    </Button>
                                </div>
                            </div>

                            {recentRuns.length > 0 && (
                                <div className="mt-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <MaterialIcon name="history" className="text-slate-600 dark:text-slate-300" size="sm" />
                                        <span className="font-bold text-slate-800 dark:text-slate-100">آخر عمليات الإهلاك</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                                        {recentRuns.map((r) => (
                                            <button
                                                key={r.get('id')}
                                                type="button"
                                                className="p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary-300 dark:hover:border-primary-600 material-transition text-right"
                                                onClick={() => {
                                                    const y = parseInt(r.get('year'));
                                                    if (y) setYear(y);
                                                }}
                                            >
                                                <div className="text-xs text-slate-500 dark:text-slate-400">سنة</div>
                                                <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{r.get('year') || '-'}</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">إجمالي</div>
                                                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{Number(r.getValue<number>('total_depreciation') || 0).toFixed(2)}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {preview && (
                                <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="md:col-span-4 p-4 rounded-xl border-2 border-primary-200 bg-primary-50 text-primary-800">
                                        <div className="font-bold mb-1">نتيجة المعاينة</div>
                                        <div className="text-sm">
                                            أصول ستُهلك: <span className="font-bold">{preview.candidateCount}</span>
                                            {' '}| إجمالي متوقع: <span className="font-bold">{Number(preview.totalDepreciation || 0).toFixed(2)}</span>
                                            {' '}| تم التخطي: <span className="font-bold">{preview.skippedCount}</span>
                                            {' '}| أخطاء: <span className="font-bold">{preview.errorCount}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {result && (
                                <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="md:col-span-4 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between gap-4">
                                        <div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">رقم التنفيذ</div>
                                            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{result.runId}</div>
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">السنة: <span className="font-bold text-slate-900 dark:text-slate-100">{result.year}</span></div>
                                    </div>
                                    <div className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                                        <div className="text-xs text-slate-500 dark:text-slate-400">تمت المعالجة</div>
                                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{result.processedCount}</div>
                                    </div>
                                    <div className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                                        <div className="text-xs text-slate-500 dark:text-slate-400">تم التخطي</div>
                                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{result.skippedCount}</div>
                                    </div>
                                    <div className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                                        <div className="text-xs text-slate-500 dark:text-slate-400">أخطاء</div>
                                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{result.errorCount}</div>
                                    </div>
                                    <div className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                                        <div className="text-xs text-slate-500 dark:text-slate-400">إجمالي الإهلاك</div>
                                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{Number(result.totalDepreciation || 0).toFixed(2)}</div>
                                    </div>

                                    {Array.isArray(result.errors) && result.errors.length > 0 && (
                                        <div className="md:col-span-4 mt-2">
                                            <div className="p-4 rounded-xl border-2 border-error-200 bg-error-50 text-error-800">
                                                <div className="font-bold mb-2">أخطاء</div>
                                                <div className="space-y-1 text-sm">
                                                    {result.errors.slice(0, 10).map((err: any, idx: number) => (
                                                        <div key={idx} className="flex items-center justify-between gap-3">
                                                            <span className="font-semibold">{err.assetTag || err.assetId}</span>
                                                            <span className="truncate">{err.message}</span>
                                                        </div>
                                                    ))}
                                                    {result.errors.length > 10 && (
                                                        <div className="text-xs">تم عرض أول 10 أخطاء فقط</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    <ConfirmModal
                        isOpen={confirmOpen}
                        onClose={() => setConfirmOpen(false)}
                        onConfirm={confirmRun}
                        title="تأكيد تنفيذ الإهلاك"
                        message={`هل أنت متأكد من تنفيذ الإهلاك لسنة ${year}؟ لا يمكن التراجع عن هذا الإجراء.`}
                        confirmText="تنفيذ"
                        cancelText="إلغاء"
                        variant="warning"
                        loading={loading}
                    />
                </div>
            </MainLayout>
        </ProtectedRoute>
    );
}

export default function DepreciationPage() {
    return <DepreciationPageContent />;
}

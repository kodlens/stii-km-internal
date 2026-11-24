import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Modal,
  Tag,
  Button,
  Spin,
  Alert,
  Tooltip,
  App,
} from 'antd';
import {
  Sparkles,
  Database,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Hash,
  Layers,
} from 'lucide-react';
import { MaterialProps } from '@/types/material';

type ChunkItem = {
  id: number;
  chunk_index: number;
  qdrant_point_id: string;
  char_count: number;
  preview: string;
  content: string;
  vectorized_at: string | null;
};

type VectorStatusData = {
  success: boolean;
  material_id: number;
  title: string;
  is_vectorized: boolean;
  qdrant_synced: boolean;
  chunks_count: number;
  content_hash: string;
  embedding_model: string;
  chunks: ChunkItem[];
};

type Props = {
  open: boolean;
  material: MaterialProps | null;
  onClose: () => void;
  onUpdated?: () => void;
};

export default function ModalVectorChunks({ open, material, onClose, onUpdated }: Props) {
  const { notification } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [vectorizing, setVectorizing] = useState(false);
  const [statusData, setStatusData] = useState<VectorStatusData | null>(null);
  const [expandedChunkId, setExpandedChunkId] = useState<number | null>(null);

  const fetchStatus = async () => {
    if (!material?.id) return;
    setLoading(true);
    try {
      const res = await axios.get<VectorStatusData>(`/admin/materials/${material.id}/vector-status`);
      setStatusData(res.data);
    } catch {
      notification.error({
        message: 'Failed to Load Chunks',
        description: 'Unable to retrieve vector status for this material.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && material?.id) {
      fetchStatus();
    } else {
      setStatusData(null);
      setExpandedChunkId(null);
    }
  }, [open, material?.id]);

  const handleVectorize = async (override: boolean = true) => {
    if (!material?.id) return;
    setVectorizing(true);
    try {
      const res = await axios.post(`/admin/materials/${material.id}/vectorize`, {
        override,
      });

      if (res.data?.success) {
        notification.success({
          message: 'Vectorization Complete',
          description: `${res.data.chunks_count} chunks embedded and synced to Qdrant (override: ${override ? 'yes' : 'no'}).`,
        });
        await fetchStatus();
        onUpdated?.();
      } else {
        notification.error({
          message: 'Vectorization Failed',
          description: res.data?.message || 'Failed to vectorize material.',
        });
      }
    } catch (err: unknown) {
      let msg = 'Failed to connect to embedding service.';
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        msg = err.response.data.message;
      }
      notification.error({
        message: 'Vectorization Error',
        description: msg,
      });
    } finally {
      setVectorizing(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={780}
      title={
        <div className="flex items-center gap-2 text-base font-bold text-slate-900 pr-6">
          <Database size={18} className="text-indigo-600" />
          <span>AI Vector Chunks & Qdrant Status</span>
        </div>
      }
      footer={[
        <Button key="close" onClick={onClose} className="rounded-lg">
          Close
        </Button>,
        <Button
          key="vectorize"
          type="primary"
          icon={<RotateCw size={14} className={vectorizing ? 'animate-spin' : ''} />}
          loading={vectorizing}
          onClick={() => handleVectorize(true)}
          className="rounded-lg !bg-indigo-600 hover:!bg-indigo-700 font-semibold"
        >
          {statusData?.is_vectorized ? 'Override & Re-Vectorize' : 'Vectorize Document'}
        </Button>,
      ]}
    >
      <div className="py-2 space-y-4">
        {/* Document Summary */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Document Title
              </span>
              <h3 className="mt-0.5 text-sm font-bold text-slate-900 truncate" title={material?.title}>
                {material?.title}
              </h3>
            </div>
            <div className="flex flex-wrap gap-1.5 shrink-0">
              {statusData?.is_vectorized ? (
                <Tag color="success" className="inline-flex items-center gap-1 font-semibold">
                  <CheckCircle2 size={12} />
                  Vectorized
                </Tag>
              ) : (
                <Tag color="default">Pending Vectorization</Tag>
              )}

              {statusData?.qdrant_synced ? (
                <Tag color="blue" className="inline-flex items-center gap-1 font-semibold">
                  <Sparkles size={12} />
                  Qdrant Synced
                </Tag>
              ) : (
                <Tag color="warning" className="inline-flex items-center gap-1 font-semibold">
                  <AlertCircle size={12} />
                  Sync Required
                </Tag>
              )}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 border-t border-slate-200/80 pt-3 text-xs text-slate-600">
            <div>
              <span className="text-slate-400">Total Chunks: </span>
              <span className="font-bold text-slate-800">{statusData?.chunks_count ?? 0}</span>
            </div>
            <div>
              <span className="text-slate-400">Embedding Model: </span>
              <span className="font-mono text-[11px] font-semibold text-indigo-700">
                {statusData?.embedding_model || 'nomic-embed-text'}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1 truncate">
              <span className="text-slate-400">Content Hash: </span>
              <Tooltip title={statusData?.content_hash}>
                <span className="font-mono text-[10px] text-slate-600">
                  {statusData?.content_hash ? `${statusData.content_hash.slice(0, 10)}...` : '—'}
                </span>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Override Notice */}
        <Alert
          message="AI Vector Synchronization"
          description="Clicking 'Override & Re-Vectorize' will split the latest document text into standard passages, compute fresh embeddings via Ollama, and replace all vector points in Qdrant."
          type="info"
          showIcon
          className="rounded-xl"
        />

        {/* Chunks List */}
        <div>
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Layers size={15} className="text-slate-500" />
              <span>Indexed Passages ({statusData?.chunks?.length ?? 0})</span>
            </div>
            <span className="text-[11px] text-slate-400">
              These chunks are searched during RAG retrieval
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <Spin />
              <p className="mt-2 text-xs text-slate-400">Loading vector chunks from repository...</p>
            </div>
          ) : statusData?.chunks?.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-10 text-center text-xs text-slate-400">
              <FileText size={24} className="mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-slate-600">No vector chunks found for this material</p>
              <p className="mt-1">Click the button below to vectorize and index this document in Qdrant.</p>
            </div>
          ) : (
            <div className="max-h-[360px] space-y-2.5 overflow-y-auto pr-1">
              {statusData?.chunks?.map((chunk) => {
                const isExpanded = expandedChunkId === chunk.id;
                return (
                  <div
                    key={chunk.id}
                    className="rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-xs transition hover:border-slate-300"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-1.5 font-bold text-indigo-700">
                        <Hash size={13} />
                        <span>Chunk #{chunk.chunk_index + 1}</span>
                        <span className="text-[10px] font-normal text-slate-400">
                          ({chunk.char_count} chars)
                        </span>
                      </div>

                      <Tooltip title={`Qdrant Point UUID: ${chunk.qdrant_point_id}`}>
                        <span className="font-mono text-[10px] text-slate-400">
                          ID: {chunk.qdrant_point_id.slice(0, 8)}...
                        </span>
                      </Tooltip>
                    </div>

                    <div className="mt-2 text-slate-700 leading-relaxed font-mono text-[11px] bg-slate-50 rounded-lg p-2.5 whitespace-pre-wrap">
                      {isExpanded ? chunk.content : chunk.preview}
                    </div>

                    {chunk.content.length > 220 && (
                      <button
                        type="button"
                        onClick={() => setExpandedChunkId(isExpanded ? null : chunk.id)}
                        className="mt-1 text-[11px] font-semibold text-indigo-600 hover:underline"
                      >
                        {isExpanded ? 'Show less' : 'Show full text'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

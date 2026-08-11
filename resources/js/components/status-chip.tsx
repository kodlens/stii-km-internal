type Status = 'save' | 'draft' | 'submit' | 'publish' | 'archive';

type Props = {
  status: Status;
};

const StatusChip = ({ status }: Props) => {
  const styles = {
    save: 'bg-blue-100 text-blue-700 ring-1 ring-blue-200',
    draft: 'bg-gray-100 text-gray-700 ring-1 ring-gray-200',
    submit: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
    publish: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
    archive: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
};

export default StatusChip;

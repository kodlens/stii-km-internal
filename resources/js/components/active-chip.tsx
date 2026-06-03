const ActiveChip = ( {status} : { status: number }) => {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        status
          ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
          : 'bg-rose-100 text-rose-700 ring-1 ring-rose-200'
      }`}
    >
      {status ? 'Active' : 'Not Active'}
    </span>
  )
}

export default ActiveChip

export default function CatHeader({ title, total }) {
  return (
    <div className="cat-hd">
      <span>{title}</span>
      {total !== null && total !== undefined && (
        <span className="cat-total">{total}</span>
      )}
    </div>
  )
}

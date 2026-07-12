interface FormCardProps {
  id: number;
  title: string;
  status: string;
  onDelete: (id: number) => void;
}

export default function FormCard({
  id,
  title,
  status,
  onDelete,
}: FormCardProps) {
  return (
    <div className="border rounded-xl p-5 shadow flex justify-between items-center">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-gray-500">{status}</p>
      </div>

      <button
        onClick={() => onDelete(id)}
        className="bg-red-500 text-white px-4 py-2 rounded-lg"
      >
        Delete
      </button>
    </div>
  );
}
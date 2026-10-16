export function RequiredMark() {
  return (
    <span aria-hidden="true" className="ml-1 text-red-600">
      *
    </span>
  );
}
export function RequiredFieldsNotice() {
  return (
    <p className="text-xs font-normal text-neutral-500">
      Todos os campos marcados com <RequiredMark /> são obrigatórios.
    </p>
  );
}

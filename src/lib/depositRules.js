export function getDepositAmount(pkg) {
  if (!pkg || pkg.deposit_type === "none" || !pkg.deposit_type) return null;
  const value = Number(pkg.deposit_value || 0);
  if (pkg.deposit_type === "fixed") return Math.min(value, Number(pkg.price || 0));
  if (pkg.deposit_type === "percentage") return (Number(pkg.price || 0) * value) / 100;
  return null;
}

export function formatDepositRule(pkg) {
  const amount = getDepositAmount(pkg);
  if (amount == null) return "Geen aanbetaling vereist";
  const rule = pkg.deposit_type === "percentage"
    ? `${Number(pkg.deposit_value || 0)}% aanbetaling (EUR ${amount.toFixed(2).replace(".", ",")})`
    : `EUR ${amount.toFixed(2).replace(".", ",")} aanbetaling`;
  if (pkg.deposit_due_mode === "booking") return `${rule}, direct bij boeken`;
  const days = Number(pkg.deposit_due_days_before_shoot || 0);
  return `${rule}, uiterlijk ${days === 0 ? "op de shootdag" : `${days} dagen voor de shoot`}`;
}

export function formatFullPaymentRule(pkg) {
  const days = Number(pkg?.full_payment_due_days_before_shoot || 0);
  if (pkg?.full_payment_due_mode === "booking") return "Het volledige bedrag direct bij boeken";
  if (pkg?.full_payment_due_mode === "after_shoot") {
    return `Het resterende bedrag uiterlijk ${days === 0 ? "op de werkelijke shootdag" : `${days} dagen na de werkelijke shootdatum`}`;
  }
  return `Het volledige bedrag uiterlijk ${days === 0 ? "op de shootdag" : `${days} dagen voor de shoot`}`;
}

export const formatCurrency = (amount: number | string) => {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(n)
}

export function generateMpesaCode(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11
  const day = now.getDate();

  const yChar = String.fromCharCode('S'.charCodeAt(0) + (year - 2024));
  const mChar = String.fromCharCode('A'.charCodeAt(0) + month);
  const dChar = day < 10 ? day.toString() : String.fromCharCode('A'.charCodeAt(0) + (day - 10));

  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let randomPart = "";
  for (let i = 0; i < 7; i++) {
    randomPart += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return `${yChar}${mChar}${dChar}${randomPart}`; // e.g., "UHHXTXDE4M"
}

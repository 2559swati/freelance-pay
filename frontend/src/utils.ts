// src/utils.ts
export const shortenAddress = (addr: string) => {
  return addr.slice(0, 6) + "…" + addr.slice(-4);
};

export const formatDate = (timestamp: number) => {
  const d = new Date(timestamp * 1000);
  return d.toLocaleString();
};

export const weiToEth = (wei: string) => {
  return (Number(wei) / 1e18).toFixed(4);
};

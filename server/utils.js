export function americanToImplied(odds) {
  if (odds > 0) {
    return 100 / (odds + 100);
  } else {
    return Math.abs(odds) / (Math.abs(odds) + 100);
  }
}

export function removeVig(homeImplied, awayImplied) {
  const total = homeImplied + awayImplied;
  return {
    home: homeImplied / total,
    away: awayImplied / total
  };
}

export function formatPercent(decimal) {
  return (decimal * 100).toFixed(1) + '%';
}
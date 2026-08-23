export function formatSalary(min: number, max: number): string {
  if (!min && !max) return 'Salary not specified';
  const formatLakh = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };
  if (min === max || (!max && min)) return formatLakh(min);
  return `${formatLakh(min)} - ${formatLakh(max)}`;
}

export function formatSalaryShort(val: number): string {
  if (!val) return '₹0';
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(0)}L`;
  return `₹${val.toLocaleString('en-IN')}`;
}

export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getInitials(name?: string | null): string {
  if (!name || typeof name !== 'string') return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  return parts
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function formatExpectedSalary(min?: number | null, max?: number | null): string {
  if (!min && !max) return 'Not specified';
  const minVal = min || 0;
  const maxVal = max || minVal;
  if (minVal === 0 && maxVal === 0) return 'Not specified';

  if (minVal >= 100000) {
    const minL = (minVal / 100000).toFixed(1).replace('.0', '');
    const maxL = (maxVal / 100000).toFixed(1).replace('.0', '');
    if (minVal === maxVal) return `₹${minL}L`;
    return `₹${minL}L - ₹${maxL}L`;
  }

  if (minVal === maxVal) return `₹${minVal.toLocaleString('en-IN')}`;
  return `₹${minVal.toLocaleString('en-IN')} - ₹${maxVal.toLocaleString('en-IN')}`;
}

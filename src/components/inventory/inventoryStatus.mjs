const PAGE_SIZE = 100;
const DERIVED_STATUSES = new Set(['available', 'low_stock', 'out_of_stock']);

const STATUS_DETAILS = {
  available: { label: 'Available', tone: 'success' },
  low_stock: { label: 'Low stock', tone: 'warning' },
  out_of_stock: { label: 'Out of stock', tone: 'danger' },
  maintenance: { label: 'Maintenance', tone: 'neutral' },
  retired: { label: 'Retired', tone: 'neutral' },
};

function normalizeStatus(value) {
  return String(value ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

export function stockStatus(item = {}) {
  const lifecycleStatus = normalizeStatus(item.status);
  if (lifecycleStatus === 'maintenance' || lifecycleStatus === 'retired') {
    return { value: lifecycleStatus, ...STATUS_DETAILS[lifecycleStatus] };
  }

  const hasQuantity = item.currentQuantity !== null &&
    item.currentQuantity !== undefined &&
    Number.isFinite(Number(item.currentQuantity));

  if (!hasQuantity) {
    const storedStatus = STATUS_DETAILS[lifecycleStatus]
      ? lifecycleStatus
      : 'available';
    return { value: storedStatus, ...STATUS_DETAILS[storedStatus] };
  }

  const quantity = Number(item.currentQuantity);
  const minimum = Number(item.minQuantity);
  const value = quantity <= 0
    ? 'out_of_stock'
    : Number.isFinite(minimum) && minimum > 0 && quantity <= minimum
      ? 'low_stock'
      : 'available';

  return { value, ...STATUS_DETAILS[value] };
}

export function isDerivedStatusFilter(status) {
  return DERIVED_STATUSES.has(normalizeStatus(status));
}

export function matchesStatusFilter(item, status) {
  const filter = normalizeStatus(status);
  if (!filter) return true;
  if (isDerivedStatusFilter(filter)) return stockStatus(item).value === filter;
  return normalizeStatus(item?.status) === filter;
}

export async function listAllEquipment(inventoryService, filters = {}) {
  const equipment = [];
  let skip = 0;

  while (true) {
    const page = await inventoryService.listEquipment({
      ...filters,
      limit: PAGE_SIZE,
      skip,
    });
    const items = Array.isArray(page?.items) ? page.items : [];
    equipment.push(...items);

    if (!items.length || page?.pagination?.hasMore === false) break;
    if (page?.pagination?.hasMore === undefined && items.length < PAGE_SIZE) break;
    skip += items.length;
  }

  return equipment;
}
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isDerivedStatusFilter,
  listAllEquipment,
  matchesStatusFilter,
  stockStatus,
} from '../components/inventory/inventoryStatus.mjs';

test('classifies available, low stock, and out of stock from quantities', () => {
  assert.deepEqual(stockStatus({ status: 'available', currentQuantity: 8, minQuantity: 3 }), {
    value: 'available', label: 'Available', tone: 'success',
  });
  assert.equal(stockStatus({ currentQuantity: 3, minQuantity: 3 }).label, 'Low stock');
  assert.equal(stockStatus({ currentQuantity: 0, minQuantity: 3 }).label, 'Out of stock');
  assert.equal(stockStatus({ status: 'available', currentQuantity: 0, minQuantity: 3 }).value, 'out_of_stock');
});

test('maintenance and retired lifecycle states take precedence over quantity', () => {
  assert.equal(stockStatus({ status: 'maintenance', currentQuantity: 0, minQuantity: 1 }).label, 'Maintenance');
  assert.equal(stockStatus({ status: 'retired', currentQuantity: 8, minQuantity: 1 }).label, 'Retired');
});

test('identifies and matches derived versus lifecycle filters', () => {
  assert.equal(isDerivedStatusFilter('low_stock'), true);
  assert.equal(isDerivedStatusFilter('out_of_stock'), true);
  assert.equal(isDerivedStatusFilter('available'), true);
  assert.equal(isDerivedStatusFilter('maintenance'), false);

  const item = { status: 'available', currentQuantity: 2, minQuantity: 2 };
  assert.equal(matchesStatusFilter(item, 'low_stock'), true);
  assert.equal(matchesStatusFilter(item, 'available'), false);
  assert.equal(matchesStatusFilter({ status: 'maintenance', currentQuantity: 5 }, 'maintenance'), true);
  assert.equal(matchesStatusFilter({ status: 'retired' }, 'retired'), true);
});

test('loads every page without sending a derived status to the API', async () => {
  const calls = [];
  const service = {
    async listEquipment(options) {
      calls.push(options);
      if (options.skip === 0) {
        return { items: [{ id: 1 }, { id: 2 }], pagination: { hasMore: true } };
      }
      return { items: [{ id: 3 }], pagination: { hasMore: false } };
    },
  };

  const result = await listAllEquipment(service, { categoryId: 'parts', q: 'motor' });

  assert.deepEqual(result, [{ id: 1 }, { id: 2 }, { id: 3 }]);
  assert.deepEqual(calls, [
    { categoryId: 'parts', q: 'motor', limit: 100, skip: 0 },
    { categoryId: 'parts', q: 'motor', limit: 100, skip: 2 },
  ]);
});
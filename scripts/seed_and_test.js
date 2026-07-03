const http = require('http');

const BASE_URL = 'http://localhost:3000';

async function fetchAPI(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = text;
  }
  
  if (!response.ok) {
    console.error(`[API ERROR] ${path}:`, json);
  }

  return {
    ok: response.ok,
    status: response.status,
    data: json,
  };
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log("🚀 Starting E2E Tests & Database Seeding...");

  // 1. Societies
  console.log("\n--- Testing Societies ---");
  const socRes = await fetchAPI('/api/societies', { method: 'POST', body: JSON.stringify({ name: 'Prestige Lakeside' }) });
  assert(socRes.ok || socRes.status === 409, "Create society (or already exists)");
  
  const socGet = await fetchAPI('/api/societies');
  assert(socGet.ok && Array.isArray(socGet.data.societies), "Fetch societies");

  // 2. Services
  console.log("\n--- Testing Services ---");
  const srvRes = await fetchAPI('/api/services', { method: 'POST', body: JSON.stringify({ name: 'Premium Wash', price: 10, icon: '🌟' }) });
  assert(srvRes.ok, "Create new service");
  
  if (srvRes.ok) {
    const srvId = srvRes.data.service.id;
    const srvPut = await fetchAPI('/api/services', { method: 'PUT', body: JSON.stringify({ id: srvId, price: 15 }) });
    assert(srvPut.ok && srvPut.data.service.price === 15, "Update service price");
    
    // Create a dummy service to delete
    const delSrvRes = await fetchAPI('/api/services', { method: 'POST', body: JSON.stringify({ name: 'Delete Me', price: 1, icon: '🗑️' }) });
    if (delSrvRes.ok) {
      const delSrvId = delSrvRes.data.service.id;
      const srvDel = await fetchAPI(`/api/services?id=${delSrvId}`, { method: 'DELETE' });
      assert(srvDel.ok, "Delete service");
    }
  }

  // 3. Customers
  console.log("\n--- Testing Customers ---");
  const custRes = await fetchAPI('/api/admin/customers', { 
    method: 'POST', 
    body: JSON.stringify({ name: 'John Doe Test', phone_number: '9876543211', society: 'Prestige Lakeside', block: 'B', flat_number: '404' }) 
  });
  assert(custRes.ok, "Upsert customer");

  const custGet = await fetchAPI('/api/admin/customers');
  assert(custGet.ok && Array.isArray(custGet.data.customers), "Fetch customers");

  // 4. Orders (Customer Side)
  console.log("\n--- Testing Customer Orders ---");
  const custOrderRes = await fetchAPI('/api/orders', {
    method: 'POST',
    body: JSON.stringify({
      order: {
        customer_name: 'John Doe Test',
        phone: '9876543211',
        society_name: 'Prestige Lakeside',
        flat_number: '404',
        block: 'B',
        pickup_date: new Date().toISOString().split('T')[0],
        pickup_slot: '9:00 AM – 11:00 AM',
        express_delivery: true,
        self_drop: false,
        notes: 'Test order from customer API',
        status: 'NEW'
      }
    })
  });
  assert(custOrderRes.ok, "Customer places new order");
  let customerOrderId;
  if (custOrderRes.ok) {
    customerOrderId = custOrderRes.data.order.id;
  }

  // 5. Orders (Admin/Walk-in)
  console.log("\n--- Testing Admin Walk-in Orders ---");
  const walkinRes = await fetchAPI('/api/admin/orders', {
    method: 'POST',
    body: JSON.stringify({
      customer_name: 'Jane Walkin Test',
      phone: '9876543212',
      society_name: 'Prestige Lakeside',
      flat_number: '101',
      block: 'A',
      pickup_date: new Date().toISOString().split('T')[0],
      pickup_slot: 'Walk-in',
      status: 'PICKED',
      items_json: { "men_shirt_kurta_tshirt": 5, "men_trouser_jeans_shorts_pyjama": 2 },
    })
  });
  assert(walkinRes.ok, "Admin creates walk-in order (status PICKED automatically)");
  
  let walkinOrderId;
  if (walkinRes.ok) {
    walkinOrderId = walkinRes.data.order.id;
    assert(walkinRes.data.order.status === "PICKED", "Walk-in order is PICKED");
  }

  // 6. Admin Orders PATCH (Testing lifecycle)
  console.log("\n--- Testing Order Lifecycle PATCH ---");
  if (customerOrderId) {
    // NEW -> PICKED
    const patchPicked = await fetchAPI('/api/admin/orders', {
      method: 'PATCH',
      body: JSON.stringify({ id: customerOrderId, status: "PICKED" })
    });
    assert(patchPicked.ok && patchPicked.data.order.status === "PICKED", "Update status NEW -> PICKED");

    // Add items and base price
    const patchItems = await fetchAPI('/api/admin/orders', {
      method: 'PATCH',
      body: JSON.stringify({ id: customerOrderId, items_json: { "home_bedsheet_double": 1 }, total_price: 150 })
    });
    assert(patchItems.ok && patchItems.data.order.total_price === 150, "Update items and total price");

    // PICKED -> READY
    const patchReady = await fetchAPI('/api/admin/orders', {
      method: 'PATCH',
      body: JSON.stringify({ id: customerOrderId, status: "READY" })
    });
    assert(patchReady.ok && patchReady.data.order.status === "READY", "Update status PICKED -> READY");

    // READY -> DELIVERED
    const patchDelivered = await fetchAPI('/api/admin/orders', {
      method: 'PATCH',
      body: JSON.stringify({ id: customerOrderId, status: "DELIVERED" })
    });
    assert(patchDelivered.ok && patchDelivered.data.order.status === "DELIVERED", "Update status READY -> DELIVERED");
  }

  // Summary
  console.log("\n=== TEST SUMMARY ===");
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log("🎉 All tests passed successfully! Dummy data has been seeded.");
    process.exit(0);
  }
}

runTests().catch(console.error);

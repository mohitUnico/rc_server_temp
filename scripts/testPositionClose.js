import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/http';

async function testPositionClose() {
    try {
        console.log('🚀 Testing Position Close Functionality\n');

        // Step 1: Create a trading account first
        console.log('1️⃣ Creating a trading account...');
        const createAccountResponse = await fetch(`${BASE_URL}/trading-accounts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: 1,
                email: 'test@example.com'
            })
        });

        if (!createAccountResponse.ok) {
            const errorText = await createAccountResponse.text();
            console.error('❌ Failed to create trading account:', errorText);
            return;
        }

        const accountResult = await createAccountResponse.json();
        console.log('✅ Trading account created successfully:', accountResult);

        // Extract account ID from the result
        let accountId;
        if (accountResult.data && accountResult.data.id) {
            accountId = accountResult.data.id;
        } else {
            console.error('❌ Could not extract account ID from account result');
            console.log('Account result:', JSON.stringify(accountResult, null, 2));
            return;
        }

        console.log(`📊 Account ID: ${accountId}\n`);

        // Step 2: Create a test position
        console.log('2️⃣ Creating a test position...');
        const createOrderResponse = await fetch(`${BASE_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                accountId: accountId,
                instrumentId: 1,
                orderType: 'marketBuy',
                lotSize: 0.5
            })
        });

        if (!createOrderResponse.ok) {
            const errorText = await createOrderResponse.text();
            console.error('❌ Failed to create order:', errorText);
            return;
        }

        const orderResult = await createOrderResponse.json();
        console.log('✅ Order created successfully:', orderResult);

        // Extract position ID from the order result
        let positionId;
        if (orderResult.position && orderResult.position.id) {
            positionId = orderResult.position.id;
        } else if (orderResult.data && orderResult.data.position && orderResult.data.position.id) {
            positionId = orderResult.data.position.id;
        } else {
            console.error('❌ Could not extract position ID from order result');
            console.log('Order result:', JSON.stringify(orderResult, null, 2));
            return;
        }

        console.log(`📊 Position ID: ${positionId}\n`);

        // Step 3: Test partial close
        console.log('3️⃣ Testing partial close...');
        const partialCloseResponse = await fetch(`${BASE_URL}/positions/${positionId}/close`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                lotSize: 0.2
            })
        });

        if (!partialCloseResponse.ok) {
            const errorText = await partialCloseResponse.text();
            console.error('❌ Partial close failed:', errorText);
        } else {
            const partialResult = await partialCloseResponse.json();
            console.log('✅ Partial close successful:', partialResult);
        }

        // Step 4: Test full close
        console.log('\n4️⃣ Testing full close...');
        const fullCloseResponse = await fetch(`${BASE_URL}/positions/${positionId}/close`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });

        if (!fullCloseResponse.ok) {
            const errorText = await fullCloseResponse.text();
            console.error('❌ Full close failed:', errorText);
        } else {
            const fullResult = await fullCloseResponse.json();
            console.log('✅ Full close successful:', fullResult);
        }

        console.log('\n🎉 Position close testing completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testPositionClose();

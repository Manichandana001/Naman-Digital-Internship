document.addEventListener('DOMContentLoaded', async function() {
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const chatMessages = document.getElementById('chatMessages');
    const userSelect = document.getElementById('userSelect');
    const statusText = document.getElementById('statusText');

    let keys = {};

    // Initialize encryption keys
    async function initKeys() {
        try {
            // Generate RSA key pairs for User A and B
            const keyPairA = await window.crypto.subtle.generateKey(
                {
                    name: "RSA-OAEP",
                    modulusLength: 2048,
                    publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
                    hash: "SHA-256",
                },
                true,
                ["encrypt", "decrypt"]
            );

            const keyPairB = await window.crypto.subtle.generateKey(
                {
                    name: "RSA-OAEP",
                    modulusLength: 2048,
                    publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
                    hash: "SHA-256",
                },
                true,
                ["encrypt", "decrypt"]
            );

            keys.A = keyPairA;
            keys.B = keyPairB;

            // Simulate key exchange: export public keys
            const publicKeyA = await window.crypto.subtle.exportKey("spki", keyPairA.publicKey);
            const publicKeyB = await window.crypto.subtle.exportKey("spki", keyPairB.publicKey);

            // Import each other's public keys
            keys.A.publicKeyB = await window.crypto.subtle.importKey(
                "spki",
                publicKeyB,
                {
                    name: "RSA-OAEP",
                    hash: "SHA-256",
                },
                true,
                ["encrypt"]
            );

            keys.B.publicKeyA = await window.crypto.subtle.importKey(
                "spki",
                publicKeyA,
                {
                    name: "RSA-OAEP",
                    hash: "SHA-256",
                },
                true,
                ["encrypt"]
            );

            // Generate shared AES key for each (simplified E2E)
            const aesKeyA = await window.crypto.subtle.generateKey(
                {
                    name: "AES-GCM",
                    length: 256,
                },
                true,
                ["encrypt", "decrypt"]
            );

            const aesKeyB = await window.crypto.subtle.generateKey(
                {
                    name: "AES-GCM",
                    length: 256,
                },
                true,
                ["encrypt", "decrypt"]
            );

            keys.A.aesKey = aesKeyA;
            keys.B.aesKey = aesKeyB;

            // Simulate AES key exchange using RSA
            const exportedAesA = await window.crypto.subtle.exportKey("raw", aesKeyA);
            const encryptedAesA = await window.crypto.subtle.encrypt(
                { name: "RSA-OAEP" },
                keys.B.publicKeyA,
                exportedAesA
            );

            const exportedAesB = await window.crypto.subtle.exportKey("raw", aesKeyB);
            const encryptedAesB = await window.crypto.subtle.encrypt(
                { name: "RSA-OAEP" },
                keys.A.publicKeyB,
                exportedAesB
            );

            // Decrypt and import AES keys
            const decryptedAesA = await window.crypto.subtle.decrypt(
                { name: "RSA-OAEP" },
                keys.A.privateKey,
                encryptedAesA
            );

            const decryptedAesB = await window.crypto.subtle.decrypt(
                { name: "RSA-OAEP" },
                keys.B.privateKey,
                encryptedAesB
            );

            keys.A.sharedAes = await window.crypto.subtle.importKey(
                "raw",
                decryptedAesA,
                { name: "AES-GCM", length: 256 },
                true,
                ["encrypt", "decrypt"]
            );

            keys.B.sharedAes = await window.crypto.subtle.importKey(
                "raw",
                decryptedAesB,
                { name: "AES-GCM", length: 256 },
                true,
                ["encrypt", "decrypt"]
            );

            statusText.textContent = "Encryption initialized. Ready to chat!";
        } catch (error) {
            console.error("Error initializing keys:", error);
            statusText.textContent = "Error initializing encryption.";
        }
    }

    await initKeys();

    sendButton.addEventListener('click', async function() {
        const message = messageInput.value.trim();
        const sender = userSelect.value;

        if (!message) return;

        try {
            // Encrypt message with AES
            const encoder = new TextEncoder();
            const data = encoder.encode(message);
            const iv = window.crypto.getRandomValues(new Uint8Array(12));

            const encrypted = await window.crypto.subtle.encrypt(
                {
                    name: "AES-GCM",
                    iv: iv,
                },
                keys[sender].sharedAes,
                data
            );

            // Combine IV and encrypted data
            const encryptedMessage = new Uint8Array(iv.length + encrypted.byteLength);
            encryptedMessage.set(iv);
            encryptedMessage.set(new Uint8Array(encrypted), iv.length);

            // Display encrypted message (in base64 for demo)
            const encryptedBase64 = btoa(String.fromCharCode(...encryptedMessage));
            displayMessage(sender, `Encrypted: ${encryptedBase64}`, sender);

            // Simulate receiving and decrypting for the other user
            const receiver = sender === 'A' ? 'B' : 'A';
            const decrypted = await decryptMessage(encryptedMessage, receiver);
            displayMessage(receiver, `Decrypted: ${decrypted}`, receiver);

            messageInput.value = '';
        } catch (error) {
            console.error("Error sending message:", error);
        }
    });

    async function decryptMessage(encryptedMessage, receiver) {
        const iv = encryptedMessage.slice(0, 12);
        const encryptedData = encryptedMessage.slice(12);

        const decrypted = await window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv,
            },
            keys[receiver].sharedAes,
            encryptedData
        );

        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    }

    function displayMessage(user, message, className) {
        const messageElement = document.createElement('div');
        messageElement.className = `message user-${className.toLowerCase()}`;
        messageElement.textContent = `${user}: ${message}`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});

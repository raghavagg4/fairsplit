// FairSplit - Bill Splitting Application
// State Management
const state = {
    people: [],
    items: [],
    tax: 0,
    tip: 0
};

// DOM Elements
const elements = {
    personNameInput: document.getElementById('person-name-input'),
    addPersonBtn: document.getElementById('add-person-btn'),
    peopleList: document.getElementById('people-list'),

    itemNameInput: document.getElementById('item-name-input'),
    itemPriceInput: document.getElementById('item-price-input'),
    addItemBtn: document.getElementById('add-item-btn'),
    itemsList: document.getElementById('items-list'),

    taxInput: document.getElementById('tax-input'),
    tipInput: document.getElementById('tip-input'),
    tipLabel: document.getElementById('tip-label'),
    tipTypeDollar: document.getElementById('tip-type-dollar'),
    tipTypePercent: document.getElementById('tip-type-percent'),

    calculateBtn: document.getElementById('calculate-btn'),
    resultsContainer: document.getElementById('results-container'),
    resultsList: document.getElementById('results-list'),
    copyBtn: document.getElementById('copy-btn')
};

// Initialize
function init() {
    // Event listeners
    elements.addPersonBtn.addEventListener('click', addPerson);
    elements.personNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addPerson();
    });

    elements.addItemBtn.addEventListener('click', addItem);
    elements.itemNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            if (!elements.itemNameInput.value) return;
            if (!elements.itemPriceInput.value) {
                elements.itemPriceInput.focus();
                return;
            }
            addItem();
        }
    });
    elements.itemPriceInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addItem();
    });

    elements.calculateBtn.addEventListener('click', calculateSplit);
    elements.copyBtn.addEventListener('click', copyToClipboard);

    // Tip type toggle listeners
    elements.tipTypeDollar.addEventListener('change', updateTipLabel);
    elements.tipTypePercent.addEventListener('change', updateTipLabel);

    renderPeople();
    renderItems();
    updateTipLabel(); // Set initial state for tip label
}

// Update tip label and placeholder based on selected type
function updateTipLabel() {
    if (elements.tipTypePercent.checked) {
        elements.tipLabel.textContent = 'Tip (%)';
        elements.tipInput.placeholder = '18';
        elements.tipInput.step = '1';
    } else {
        elements.tipLabel.textContent = 'Tip ($)';
        elements.tipInput.placeholder = '0.00';
        elements.tipInput.step = '0.01';
    }
}

// Add Person
function addPerson() {
    const name = elements.personNameInput.value.trim();

    if (!name) {
        elements.personNameInput.focus();
        return;
    }

    // Check for duplicates
    if (state.people.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        alert('This person is already added!');
        elements.personNameInput.value = '';
        elements.personNameInput.focus();
        return;
    }

    state.people.push({
        id: Date.now(),
        name: name
    });

    elements.personNameInput.value = '';
    elements.personNameInput.focus();
    renderPeople();
}

// Remove Person
function removePerson(id) {
    state.people = state.people.filter(p => p.id !== id);

    // Remove this person from all items
    state.items.forEach(item => {
        item.assignedTo = item.assignedTo.filter(personId => personId !== id);
    });

    renderPeople();
    renderItems();
}

// Render People List
function renderPeople() {
    if (state.people.length === 0) {
        elements.peopleList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">👥</div>
        <p class="empty-state-text">Add people who shared the bill</p>
      </div>
    `;
        return;
    }

    elements.peopleList.innerHTML = state.people.map(person => `
    <li class="list-item">
      <div class="list-item-content">
        <span class="list-item-name">${escapeHtml(person.name)}</span>
      </div>
      <div class="list-item-actions">
        <button class="btn btn-danger btn-small" onclick="removePerson(${person.id})">
          Remove
        </button>
      </div>
    </li>
  `).join('');
}

// Add Item
function addItem() {
    const name = elements.itemNameInput.value.trim();
    const price = parseFloat(elements.itemPriceInput.value);

    if (!name) {
        elements.itemNameInput.focus();
        return;
    }

    if (!price || price <= 0) {
        elements.itemPriceInput.focus();
        return;
    }

    state.items.push({
        id: Date.now(),
        name: name,
        price: price,
        assignedTo: [] // Array of person IDs
    });

    elements.itemNameInput.value = '';
    elements.itemPriceInput.value = '';
    elements.itemNameInput.focus();
    renderItems();
}

// Remove Item
function removeItem(id) {
    state.items = state.items.filter(i => i.id !== id);
    renderItems();
}

// Toggle person assignment to item
function togglePersonForItem(itemId, personId) {
    const item = state.items.find(i => i.id === itemId);
    if (!item) return;

    const index = item.assignedTo.indexOf(personId);
    if (index === -1) {
        item.assignedTo.push(personId);
    } else {
        item.assignedTo.splice(index, 1);
    }

    renderItems();
}

// Render Items List
function renderItems() {
    if (state.items.length === 0) {
        elements.itemsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🍽️</div>
        <p class="empty-state-text">Add items from the receipt</p>
      </div>
    `;
        return;
    }

    elements.itemsList.innerHTML = state.items.map(item => {
        const assignedPeople = item.assignedTo.map(personId => {
            const person = state.people.find(p => p.id === personId);
            return person ? person.name : '';
        }).filter(Boolean);

        return `
      <li class="list-item">
        <div class="list-item-content" style="flex-direction: column; align-items: flex-start;">
          <div style="display: flex; justify-content: space-between; width: 100%; margin-bottom: 0.5rem;">
            <span class="list-item-name">${escapeHtml(item.name)}</span>
            <span class="list-item-price">$${item.price.toFixed(2)}</span>
          </div>
          ${state.people.length > 0 ? `
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
              ${state.people.map(person => `
                <span 
                  class="tag ${item.assignedTo.includes(person.id) ? '' : 'tag-removable'}" 
                  onclick="togglePersonForItem(${item.id}, ${person.id})"
                  style="${item.assignedTo.includes(person.id) ? 'background: rgba(0, 212, 255, 0.2); border-color: rgba(0, 212, 255, 0.4); color: var(--accent-primary);' : 'opacity: 0.5;'}"
                >
                  ${item.assignedTo.includes(person.id) ? '✓' : ''} ${escapeHtml(person.name)}
                </span>
              `).join('')}
            </div>
          ` : '<p style="font-size: 0.875rem; color: var(--text-muted);">Add people first to assign items</p>'}
        </div>
        <div class="list-item-actions">
          <button class="btn btn-danger btn-small" onclick="removeItem(${item.id})">
            ✕
          </button>
        </div>
      </li>
    `;
    }).join('');
}

// Calculate Split
function calculateSplit() {
    // Validation
    if (state.people.length === 0) {
        alert('Please add at least one person!');
        return;
    }

    if (state.items.length === 0) {
        alert('Please add at least one item!');
        return;
    }

    // Check if all items are assigned
    const unassignedItems = state.items.filter(item => item.assignedTo.length === 0);
    if (unassignedItems.length > 0) {
        alert(`Please assign all items to people. Unassigned: ${unassignedItems.map(i => i.name).join(', ')}`);
        return;
    }

    // Get tax
    state.tax = parseFloat(elements.taxInput.value) || 0;

    // Calculate subtotal
    const subtotal = state.items.reduce((sum, item) => sum + item.price, 0);

    // Get tip (either as dollar amount or calculate from percentage)
    const tipValue = parseFloat(elements.tipInput.value) || 0;
    if (elements.tipTypePercent.checked) {
        // Calculate tip as percentage of (subtotal + tax)
        state.tip = ((subtotal + state.tax) * tipValue) / 100;
    } else {
        state.tip = tipValue;
    }

    // Calculate totals for each person
    const results = {};

    // Initialize results for each person
    state.people.forEach(person => {
        results[person.id] = {
            name: person.name,
            items: [],
            itemsTotal: 0,
            taxShare: 0,
            tipShare: 0,
            total: 0
        };
    });

    // Calculate item costs (split among assigned people)
    state.items.forEach(item => {
        const shareCount = item.assignedTo.length;
        const pricePerPerson = item.price / shareCount;

        item.assignedTo.forEach(personId => {
            if (results[personId]) {
                results[personId].items.push({
                    name: item.name,
                    price: pricePerPerson,
                    shared: shareCount > 1
                });
                results[personId].itemsTotal += pricePerPerson;
            }
        });
    });

    // Divide tax and tip proportionally based on each person's share of the subtotal
    state.people.forEach(person => {
        const personSubtotal = results[person.id].itemsTotal;
        const proportion = subtotal > 0 ? personSubtotal / subtotal : 1 / state.people.length;

        results[person.id].taxShare = state.tax * proportion;
        results[person.id].tipShare = state.tip * proportion;
        results[person.id].total = results[person.id].itemsTotal + results[person.id].taxShare + results[person.id].tipShare;
    });

    // Render results
    renderResults(results);

    // Show results section with animation
    elements.resultsContainer.classList.remove('hidden');
    elements.resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Render Results
function renderResults(results) {
    const resultEntries = Object.values(results);

    elements.resultsList.innerHTML = resultEntries.map(result => `
    <div class="result-item">
      <div class="result-person">${escapeHtml(result.name)}</div>
      <div class="result-breakdown">
        ${result.items.map(item =>
        `• ${escapeHtml(item.name)}: $${item.price.toFixed(2)}${item.shared ? ' (split)' : ''}`
    ).join('<br>')}
        ${result.taxShare > 0 ? `<br>• Tax: $${result.taxShare.toFixed(2)}` : ''}
        ${result.tipShare > 0 ? `<br>• Tip: $${result.tipShare.toFixed(2)}` : ''}
      </div>
      <div class="result-total">$${result.total.toFixed(2)}</div>
    </div>
  `).join('');
}

// Copy to Clipboard
function copyToClipboard() {
    // Recalculate to get current results
    const results = {};

    state.people.forEach(person => {
        results[person.id] = {
            name: person.name,
            items: [],
            itemsTotal: 0,
            taxShare: 0,
            tipShare: 0,
            total: 0
        };
    });

    // Re-read tax and calculate actual tip based on current inputs
    const currentTax = parseFloat(elements.taxInput.value) || 0;
    const subtotal = state.items.reduce((sum, item) => sum + item.price, 0);

    const tipValue = parseFloat(elements.tipInput.value) || 0;
    let actualTip;
    if (elements.tipTypePercent.checked) {
        actualTip = ((subtotal + currentTax) * tipValue) / 100;
    } else {
        actualTip = tipValue;
    }

    state.items.forEach(item => {
        const shareCount = item.assignedTo.length;
        const pricePerPerson = item.price / shareCount;

        item.assignedTo.forEach(personId => {
            if (results[personId]) {
                results[personId].items.push({
                    name: item.name,
                    price: pricePerPerson,
                    shared: shareCount > 1
                });
                results[personId].itemsTotal += pricePerPerson;
            }
        });
    });

    // Use proportional splitting for tax and tip
    state.people.forEach(person => {
        const personSubtotal = results[person.id].itemsTotal;
        const proportion = subtotal > 0 ? personSubtotal / subtotal : 1 / state.people.length;

        results[person.id].taxShare = currentTax * proportion;
        results[person.id].tipShare = actualTip * proportion;
        results[person.id].total = results[person.id].itemsTotal + results[person.id].taxShare + results[person.id].tipShare;
    });

    // Format for text
    const resultEntries = Object.values(results);
    const grandTotal = subtotal + currentTax + actualTip;

    let text = '💰 FairSplit - Bill Breakdown\n\n';

    resultEntries.forEach(result => {
        text += `${result.name}: $${result.total.toFixed(2)}\n`;
        result.items.forEach(item => {
            text += `  • ${item.name}: $${item.price.toFixed(2)}${item.shared ? ' (split)' : ''}\n`;
        });
        if (result.taxShare > 0) {
            text += `  • Tax: $${result.taxShare.toFixed(2)}\n`;
        }
        if (result.tipShare > 0) {
            text += `  • Tip: $${result.tipShare.toFixed(2)}\n`;
        }
        text += '\n';
    });

    text += `Total Bill: $${grandTotal.toFixed(2)}\n`;
    text += `(Subtotal: $${subtotal.toFixed(2)} + Tax: $${currentTax.toFixed(2)} + Tip: $${actualTip.toFixed(2)})`;

    // Copy to clipboard
    navigator.clipboard.writeText(text).then(() => {
        // Visual feedback
        const originalText = elements.copyBtn.innerHTML;
        elements.copyBtn.innerHTML = '<span class="btn-icon">✓</span> Copied!';
        elements.copyBtn.style.background = 'rgba(16, 185, 129, 0.3)';

        setTimeout(() => {
            elements.copyBtn.innerHTML = originalText;
            elements.copyBtn.style.background = '';
        }, 2000);
    }).catch(err => {
        alert('Failed to copy to clipboard. Please try again.');
        console.error('Copy failed:', err);
    });
}

// =====================================================
// BILL SCANNER FUNCTIONALITY
// =====================================================

let tesseractLoaded = false;
let extractedItems = [];

// Scanner DOM Elements
const scannerElements = {
    scanBillBtn: document.getElementById('scan-bill-btn'),
    billImageInput: document.getElementById('bill-image-input'),
    scanModal: document.getElementById('scan-modal'),
    scanModalOverlay: document.getElementById('scan-modal-overlay'),
    scanModalClose: document.getElementById('scan-modal-close'),
    billPreview: document.getElementById('bill-preview'),
    scanLoading: document.getElementById('scan-loading'),
    extractedItemsContainer: document.getElementById('extracted-items-container'),
    extractedItemsList: document.getElementById('extracted-items-list'),
    scanModalActions: document.getElementById('scan-modal-actions'),
    addScannedItemsBtn: document.getElementById('add-scanned-items-btn'),
    cancelScanBtn: document.getElementById('cancel-scan-btn')
};

// Initialize scanner event listeners
function initScanner() {
    scannerElements.scanBillBtn.addEventListener('click', openFileInput);
    scannerElements.billImageInput.addEventListener('change', handleImageSelect);
    scannerElements.scanModalClose.addEventListener('click', closeScanModal);
    scannerElements.scanModalOverlay.addEventListener('click', closeScanModal);
    scannerElements.cancelScanBtn.addEventListener('click', closeScanModal);
    scannerElements.addScannedItemsBtn.addEventListener('click', addScannedItems);
}

// Load Tesseract.js dynamically
async function loadTesseract() {
    if (tesseractLoaded) return true;

    try {
        // Load Tesseract.js from CDN
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
        document.head.appendChild(script);

        await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
        });

        tesseractLoaded = true;
        return true;
    } catch (error) {
        console.error('Failed to load Tesseract.js:', error);
        alert('Failed to load OCR library. Please check your internet connection.');
        return false;
    }
}

// Open file input
function openFileInput() {
    scannerElements.billImageInput.click();
}

// Handle image selection
async function handleImageSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Show modal
    scannerElements.scanModal.classList.remove('hidden');

    // Show image preview
    const reader = new FileReader();
    reader.onload = (e) => {
        scannerElements.billPreview.src = e.target.result;
        scannerElements.billPreview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);

    // Start processing
    await processReceipt(file);
}

// Close scan modal
function closeScanModal() {
    scannerElements.scanModal.classList.add('hidden');
    scannerElements.billPreview.classList.add('hidden');
    scannerElements.scanLoading.classList.add('hidden');
    scannerElements.extractedItemsContainer.classList.add('hidden');
    scannerElements.scanModalActions.classList.add('hidden');
    scannerElements.billImageInput.value = '';
    extractedItems = [];
}

// Process receipt with OCR
async function processReceipt(imageFile) {
    // Show loading
    scannerElements.scanLoading.classList.remove('hidden');
    scannerElements.extractedItemsContainer.classList.add('hidden');
    scannerElements.scanModalActions.classList.add('hidden');

    try {
        // Load Tesseract if not already loaded
        const loaded = await loadTesseract();
        if (!loaded) {
            closeScanModal();
            return;
        }

        // Initialize Tesseract worker
        const worker = await Tesseract.createWorker('eng');

        // Process image
        const { data: { text } } = await worker.recognize(imageFile);

        // Terminate worker
        await worker.terminate();

        // Parse text for items
        extractedItems = parseReceiptText(text);

        // Show results
        displayExtractedItems();

    } catch (error) {
        console.error('OCR processing failed:', error);
        alert('Failed to process receipt. Please try again or add items manually.');
        closeScanModal();
    }
}

// Parse receipt text to extract items
function parseReceiptText(text) {
    const lines = text.split('\n');
    const items = [];

    // Common receipt patterns
    const patterns = [
        // "Item Name ... $12.99" or "Item Name .... 12.99"
        /^(.+?)\s*[\.]{2,}\s*\$?(\d+\.\d{2})$/,
        // "Item Name $12.99" or "Item Name 12.99"
        /^(.+?)\s+\$?(\d+\.\d{2})$/,
        // "12.99 Item Name" (price first)
        /^\$?(\d+\.\d{2})\s+(.+)$/,
    ];

    for (const line of lines) {
        const trimmedLine = line.trim();

        // Skip empty lines or very short lines
        if (trimmedLine.length < 3) continue;

        // Skip lines that look like headers or totals
        if (/^(total|subtotal|tax|tip|payment|card|cash|change)/i.test(trimmedLine)) continue;

        let matched = false;

        // Try each pattern
        for (const pattern of patterns) {
            const match = trimmedLine.match(pattern);

            if (match) {
                let name, price;

                // Check if price is first or second group
                if (pattern.source.startsWith('^\\$?\\(\\\\d')) {
                    // Price first pattern
                    price = parseFloat(match[1]);
                    name = match[2].trim();
                } else {
                    // Name first pattern
                    name = match[1].trim();
                    price = parseFloat(match[2]);
                }

                // Validate price is reasonable
                if (price > 0 && price < 1000) {
                    // Clean up name
                    name = name.replace(/[\.]+$/g, '').trim();

                    // Check if name seems reasonable (not just numbers or weird characters)
                    if (name.length > 0 && name.length < 50) {
                        items.push({
                            name: name,
                            price: price,
                            isPlaceholder: false,
                            selected: true
                        });
                        matched = true;
                        break;
                    }
                }
            }
        }

        // If we found a price but couldn't extract a good name
        if (!matched && /\d+\.\d{2}/.test(trimmedLine)) {
            const priceMatch = trimmedLine.match(/(\d+\.\d{2})/);
            if (priceMatch) {
                const price = parseFloat(priceMatch[1]);
                if (price > 0 && price < 1000) {
                    items.push({
                        name: '[Item Name]',
                        price: price,
                        isPlaceholder: true,
                        selected: true
                    });
                }
            }
        }
    }

    return items;
}

// Display extracted items in modal
function displayExtractedItems() {
    scannerElements.scanLoading.classList.add('hidden');

    if (extractedItems.length === 0) {
        alert('No items found in the receipt. Please add items manually.');
        closeScanModal();
        return;
    }

    scannerElements.extractedItemsContainer.classList.remove('hidden');
    scannerElements.scanModalActions.classList.remove('hidden');

    scannerElements.extractedItemsList.innerHTML = extractedItems.map((item, index) => `
        <div class="extracted-item ${item.isPlaceholder ? 'placeholder' : ''}">
            <input 
                type="checkbox" 
                class="extracted-item-checkbox" 
                id="extracted-${index}" 
                ${item.selected ? 'checked' : ''}
                onchange="toggleExtractedItem(${index})"
            >
            <div class="extracted-item-inputs">
                <input 
                    type="text" 
                    class="extracted-item-name" 
                    value="${escapeHtml(item.name)}"
                    placeholder="Item name"
                    onchange="updateExtractedItemName(${index}, this.value)"
                >
                <input 
                    type="number" 
                    class="extracted-item-price" 
                    value="${item.price.toFixed(2)}"
                    step="0.01"
                    min="0"
                    placeholder="Price"
                    onchange="updateExtractedItemPrice(${index}, this.value)"
                >
            </div>
        </div>
    `).join('');
}

// Toggle extracted item selection
function toggleExtractedItem(index) {
    extractedItems[index].selected = !extractedItems[index].selected;
}

// Update extracted item name
function updateExtractedItemName(index, newName) {
    extractedItems[index].name = newName;
    // Remove placeholder flag if user edits
    extractedItems[index].isPlaceholder = false;
}

// Update extracted item price
function updateExtractedItemPrice(index, newPrice) {
    extractedItems[index].price = parseFloat(newPrice) || 0;
}

// Add selected scanned items to main list
function addScannedItems() {
    const selectedItems = extractedItems.filter(item => item.selected && item.name && item.price > 0);

    if (selectedItems.length === 0) {
        alert('Please select at least one item with a valid name and price.');
        return;
    }

    // Add each selected item to state
    selectedItems.forEach(item => {
        state.items.push({
            id: Date.now() + Math.random(), // Ensure unique IDs
            name: item.name,
            price: item.price,
            assignedTo: []
        });
    });

    // Re-render items list
    renderItems();

    // Close modal
    closeScanModal();

    // Scroll to items section
    elements.itemsList.scrollIntoView({ behavior: 'smooth' });
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize app
initScanner();
init();

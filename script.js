document.addEventListener('DOMContentLoaded', () => {
    console.log('DND Project loaded successfully!');
    
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbotBody = document.getElementById('chatbot-body');
    const chatbotClear = document.getElementById('chatbot-clear');
    
    let apiData = null;
    const HISTORY_KEY = 'dnd_chat_history';
    
    // API Configuration - Add new API sources here
    const API_CONFIG = {
        dnd5e: {
            baseUrl: 'https://www.dnd5eapi.co/api',
            endpoints: {
                spells: '/spells',
                monsters: '/monsters',
                classes: '/classes',
                races: '/races',
                equipment: '/equipment',
                'magic-items': '/magic-items',
                skills: '/skills',
                features: '/features',
                traits: '/traits',
                conditions: '/conditions',
                'damage-types': '/damage-types',
                'magic-schools': '/magic-schools',
                rules: '/rules',
                'ability-scores': '/ability-scores'
            },
            keywords: {
                'spell': 'spells',
                'monster': 'monsters',
                'creature': 'monsters',
                'class': 'classes',
                'race': 'races',
                'equipment': 'equipment',
                'item': 'equipment',
                'magic': 'magic-items',
                'skill': 'skills',
                'feature': 'features',
                'trait': 'traits',
                'condition': 'conditions',
                'damage': 'damage-types',
                'school': 'magic-schools',
                'rule': 'rules',
                'ability': 'ability-scores',
                'str': 'ability-scores',
                'dex': 'ability-scores',
                'con': 'ability-scores',
                'int': 'ability-scores',
                'wis': 'ability-scores',
                'cha': 'ability-scores'
            }
        }
        // Add more API configurations here:
        // example: {
        //     baseUrl: 'https://www.dnd5eapi.co',
        //     endpoints: { ... },
        //     keywords: { ... }
        // }
    };
    
    // Load API endpoints
    const myHeaders = new Headers();
    myHeaders.append("Accept", "application/json");
    
    const requestOptions = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
    };
    
    fetch(API_CONFIG.dnd5e.baseUrl, requestOptions)
        .then((response) => response.json())
        .then((result) => {
            apiData = result;
            console.log('API data loaded:', result);
            loadChatHistory();
            if (getChatHistory().length === 0) {
                addBotMessage('Hello! I can help you explore D&D 5e content. Try asking about: spells, monsters, classes, races, equipment, magic-items, skills, features, traits, conditions, rules, or abilities. You can also ask for details like "tell me about strength ability".');
            }
        })
        .catch((error) => {
            console.error(error);
            addBotMessage('Sorry, I had trouble connecting to the D&D API.');
        });
    
    // Toggle chatbot
    chatbotToggle.addEventListener('click', () => {
        chatbotBody.classList.toggle('collapsed');
        chatbotToggle.textContent = chatbotBody.classList.contains('collapsed') ? '+' : '−';
    });
    
    // Clear chat history
    chatbotClear.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the chat history?')) {
            clearChatHistory();
        }
    });
    
    // Send message on button click
    chatSend.addEventListener('click', sendMessage);
    
    // Send message on Enter key
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;
        
        addUserMessage(message);
        chatInput.value = '';
        
        processUserQuery(message);
    }
    
    function addUserMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user';
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        saveChatMessage('user', text);
    }
    
    function addBotMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot';
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        saveChatMessage('bot', text);
    }
    
    function addLoadingMessage() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message loading';
        messageDiv.textContent = 'Searching...';
        messageDiv.id = 'loading-message';
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function removeLoadingMessage() {
        const loading = document.getElementById('loading-message');
        if (loading) loading.remove();
    }
    
    function processUserQuery(query) {
        if (!apiData) {
            addBotMessage('Still loading API data, please wait...');
            return;
        }
        
        const lowerQuery = query.toLowerCase();
        
        // Check if user wants detailed info
        const wantsDetails = lowerQuery.includes('tell me about') || 
                           lowerQuery.includes('details about') || 
                           lowerQuery.includes('info about') ||
                           lowerQuery.includes('describe');
        
        // Determine which endpoint to query using API_CONFIG
        let endpoint = null;
        let searchTerm = query;
        let apiSource = 'dnd5e';
        
        // Check keywords from API configuration
        for (const [keyword, endpointName] of Object.entries(API_CONFIG.dnd5e.keywords)) {
            if (lowerQuery.includes(keyword)) {
                endpoint = endpointName;
                const regex = new RegExp(keyword + '[s]?', 'i');
                searchTerm = query.replace(regex, '').trim();
                searchTerm = searchTerm.replace(/tell me about|details about|info about|describe/gi, '').trim();
                break;
            }
        }
        
        if (endpoint) {
            if (wantsDetails && searchTerm) {
                fetchDetailedInfo(apiSource, endpoint, searchTerm);
            } else {
                searchEndpoint(apiSource, endpoint, searchTerm);
            }
        } else {
            const availableCategories = Object.keys(API_CONFIG.dnd5e.endpoints).join(', ');
            addBotMessage(`I can help you search for: ${availableCategories}. Try asking "search for fireball spell" or "tell me about dragons".`);
        }
    }
    
    function searchEndpoint(apiSource, endpoint, searchTerm) {
        addLoadingMessage();
        
        const apiConfig = API_CONFIG[apiSource];
        const apiUrl = `${apiConfig.baseUrl}${apiConfig.endpoints[endpoint]}`;
        
        fetch(apiUrl, requestOptions)
            .then(response => response.json())
            .then(data => {
                removeLoadingMessage();
                
                if (searchTerm) {
                    const results = data.results.filter(item => 
                        item.name.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                    
                    if (results.length > 0) {
                        addBotMessage(`Found ${results.length} result(s) in ${endpoint}:`);
                        results.slice(0, 5).forEach(item => {
                            addBotMessage(`• ${item.name} - Click to ask "tell me about ${item.name}"`);
                        });
                        if (results.length > 5) {
                            addBotMessage(`...and ${results.length - 5} more.`);
                        }
                    } else {
                        addBotMessage(`No results found for "${searchTerm}" in ${endpoint}.`);
                    }
                } else {
                    addBotMessage(`Here are some ${endpoint}: ${data.results.slice(0, 5).map(i => i.name).join(', ')}...`);
                }
            })
            .catch(error => {
                removeLoadingMessage();
                console.error(error);
                addBotMessage('Sorry, I encountered an error searching the D&D API.');
            });
    }
    
    function fetchDetailedInfo(apiSource, endpoint, searchTerm) {
        addLoadingMessage();
        
        const apiConfig = API_CONFIG[apiSource];
        
        // First, get the list to find the exact index
        fetch(`${apiConfig.baseUrl}${apiConfig.endpoints[endpoint]}`, requestOptions)
            .then(response => response.json())
            .then(data => {
                const match = data.results.find(item => 
                    item.name.toLowerCase() === searchTerm.toLowerCase() ||
                    item.index?.toLowerCase() === searchTerm.toLowerCase()
                );
                
                if (match) {
                    // Fetch detailed info using the index
                    return fetch(`${apiConfig.baseUrl}${apiConfig.endpoints[endpoint]}/${match.index}`, requestOptions);
                } else {
                    throw new Error('Item not found');
                }
            })
            .then(response => response.json())
            .then(details => {
                removeLoadingMessage();
                displayDetailedInfo(details, endpoint);
            })
            .catch(error => {
                removeLoadingMessage();
                console.error(error);
                addBotMessage(`Sorry, I couldn't find detailed information for "${searchTerm}" in ${endpoint}.`);
            });
    }
    
    function displayDetailedInfo(details, endpoint) {
        addBotMessage(`📋 ${details.name || details.full_name}`);
        
        // Display relevant information based on endpoint type
        if (endpoint === 'ability-scores') {
            addBotMessage(`Full Name: ${details.full_name}`);
            addBotMessage(`Description: ${details.desc?.[0] || 'No description available'}`);
            if (details.skills) {
                addBotMessage(`Skills: ${details.skills.map(s => s.name).join(', ')}`);
            }
        } else if (endpoint === 'spells') {
            addBotMessage(`Level: ${details.level}`);
            addBotMessage(`School: ${details.school?.name || 'N/A'}`);
            if (details.desc) {
                addBotMessage(`Description: ${details.desc.join(' ')}`);
            }
        } else if (endpoint === 'monsters') {
            addBotMessage(`Type: ${details.type || 'N/A'}`);
            addBotMessage(`HP: ${details.hit_points || 'N/A'}`);
            addBotMessage(`AC: ${details.armor_class?.[0]?.value || 'N/A'}`);
        } else if (details.desc) {
            // Generic description display
            const description = Array.isArray(details.desc) ? details.desc.join(' ') : details.desc;
            addBotMessage(`Description: ${description}`);
        }
        
        addBotMessage('💡 Tip: You can ask about other items too!');
    }
    
    function saveChatMessage(sender, text) {
        const history = getChatHistory();
        history.push({
            sender: sender,
            text: text,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }
    
    function getChatHistory() {
        const history = localStorage.getItem(HISTORY_KEY);
        return history ? JSON.parse(history) : [];
    }
    
    function loadChatHistory() {
        const history = getChatHistory();
        history.forEach(message => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${message.sender}`;
            messageDiv.textContent = message.text;
            chatMessages.appendChild(messageDiv);
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function clearChatHistory() {
        localStorage.removeItem(HISTORY_KEY);
        chatMessages.innerHTML = '';
        addBotMessage('Chat history cleared! How can I help you with D&D 5e content?');
    }
    
    // Expose clear function globally for optional clear button
    window.clearDndChatHistory = clearChatHistory;
    
    // Helper function to add new API sources dynamically
    function addAPISource(name, config) {
        API_CONFIG[name] = config;
        console.log(`API source "${name}" added successfully`);
    }
    
    // Expose helper functions globally
    window.addAPISource = addAPISource;
    window.getAPIConfig = () => API_CONFIG;
    
    // Add click handlers for ability score cards
    const abilityCards = document.querySelectorAll('.ability-card');
    abilityCards.forEach(card => {
        card.addEventListener('click', () => {
            const ability = card.dataset.ability;
            const abilityName = card.querySelector('h3').textContent;
            
            // Open chatbot if collapsed
            if (chatbotBody.classList.contains('collapsed')) {
                chatbotBody.classList.remove('collapsed');
                chatbotToggle.textContent = '−';
            }
            
            // Simulate user asking about the ability
            chatInput.value = `tell me about ${abilityName}`;
            sendMessage();
        });
    });
});

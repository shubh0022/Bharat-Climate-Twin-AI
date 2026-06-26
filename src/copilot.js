// AI Climate Copilot Answers Library
const PRESSETS_RESPONSES = {
  'which districts are at highest flood risk next week?': 
    `Analyzing current runoff matrices and cloud optical thickness metrics for the next 7 days. Extreme flood threat levels detected in the following subdivisions:
    
• <strong>Assam:</strong> Dhemaji, Lakhimpur, and Barpeta districts (Risk: 92%, projected runoff coefficient exceeds 4.5). Catchment gauges on Brahmaputra report active surge profiles.
• <strong>Kerala:</strong> Wayanad and Idukki districts (Risk: 84%, high slope velocity risk). Preceding 48h rainfall has saturated topsoil.
• <strong>Bihar:</strong> Darbhanga and Madhubani districts (Risk: 79%, overflow vector from Bagmati basin).

<strong>Operational Command:</strong> Reinforce embankments along the northern banks of Brahmaputra and prepare local emergency response teams.`,

  'what is the projected temperature deviation for Rajasthan next month?': 
    `Running convective-radiative boundary prediction models for the Western Zone. Anomalies projected:

• <strong>Thermal Deviation:</strong> Western districts (Barmer, Jaisalmer, Bikaner) are modeled to witness <strong>+2.4°C</strong> above the 30-year climatological baseline.
• <strong>Heatwave Duration:</strong> Prolonged anomalies; forecast projects consecutive heatwave days extending by 6 days.
• <strong>Soil Moisture:</strong> Projected to drop below 8% in topsoil layers, creating severe agricultural stress.

<strong>Mitigation recommendation:</strong> Implement early cooling center alerts and coordinate irrigation scheduling via Bhuvan portals.`,

  'run monsoon temporal shift anomaly analysis.': 
    `Monsoon tracking payload analysis compiled. Ingesting INSAT-3DR Sea Surface Temperature (SST) parameters:

• <strong>Arabian Sea SST:</strong> +0.8°C above average, slowing down the atmospheric pressure gradient build-up.
• <strong>Temporal Shift:</strong> Landfall over Kerala is projected to be delayed by <strong>3 days</strong> compared to the historical June 1 threshold.
• <strong>Intensity Variance:</strong> Higher convective energy in the Bay of Bengal points to a +14% precipitation surge during early July across Odisha, West Bengal, and Jharkhand.

<strong>Data source:</strong> Interpolated from INSAT SST and IMD long-range wind vector fields.`
};

const DEFAULT_RESPONSE = 
  `Connecting to MOSDAC datastream... Ingesting INSAT-3DR grid coordinates. 

The current telemetry grid shows operational stability. Atmospheric moisture vectors indicate healthy vegetation transpiration. 

No active critical climate anomalies modeled for your search parameter in the immediate 72-hour window. Please specify a district name or ask about regional variables (e.g., rainfall, temperature) to query the database.`;

// Streaming character-by-character effect
function streamText(container, htmlContent, onComplete) {
  // Clear container
  container.innerHTML = '';
  
  // Create temp element to hold markup and parse it into structured tokens (words/tags)
  const temp = document.createElement('div');
  temp.innerHTML = htmlContent;

  const childNodes = Array.from(temp.childNodes);
  let nodeIndex = 0;
  let textIndex = 0;
  
  const cursor = document.createElement('span');
  cursor.className = 'chat-cursor';
  cursor.style.display = 'inline-block';
  cursor.style.width = '6px';
  cursor.style.height = '12px';
  cursor.style.backgroundColor = 'var(--color-accent)';
  cursor.style.marginLeft = '4px';

  container.appendChild(cursor);

  function type() {
    if (nodeIndex >= childNodes.length) {
      cursor.remove();
      if (onComplete) onComplete();
      return;
    }

    const currentNode = childNodes[nodeIndex];

    if (currentNode.nodeType === Node.TEXT_NODE) {
      // Stream text node character by character
      const text = currentNode.textContent;
      if (textIndex < text.length) {
        // Insert character before cursor
        const char = text.charAt(textIndex);
        cursor.before(char);
        textIndex++;
        setTimeout(type, 8); // Fast typing
      } else {
        nodeIndex++;
        textIndex = 0;
        setTimeout(type, 10);
      }
    } else {
      // Append element nodes (like HTML tags) instantly
      const clone = currentNode.cloneNode(true);
      cursor.before(clone);
      nodeIndex++;
      setTimeout(type, 20);
    }
  }

  type();
}

export function initCopilot() {
  const form = document.getElementById('copilotChatForm');
  const input = document.getElementById('chatInput');
  const chatOutput = document.getElementById('chatOutput');
  const suggestions = document.querySelectorAll('.prompt-suggestion-box');

  if (!form || !input || !chatOutput) return;

  function handleQuery(queryText) {
    if (!queryText.trim()) return;

    // 1. Add User Message
    const userBubble = document.createElement('div');
    userBubble.className = 'chat-bubble user';
    userBubble.textContent = queryText;
    chatOutput.appendChild(userBubble);
    input.value = '';

    // Scroll to bottom
    chatOutput.scrollTop = chatOutput.scrollHeight;

    // 2. Prepare AI Message
    setTimeout(() => {
      const aiBubble = document.createElement('div');
      aiBubble.className = 'chat-bubble ai';
      chatOutput.appendChild(aiBubble);

      // Find matching preset response or default
      const key = queryText.trim().toLowerCase();
      const responseHtml = PRESSETS_RESPONSES[key] || DEFAULT_RESPONSE;

      // Disable inputs during typing
      input.disabled = true;
      const sendBtn = document.getElementById('btnSendChat');
      if (sendBtn) sendBtn.disabled = true;

      // Stream text
      streamText(aiBubble, responseHtml, () => {
        input.disabled = false;
        if (sendBtn) sendBtn.disabled = false;
        input.focus();
        chatOutput.scrollTop = chatOutput.scrollHeight;
      });

      chatOutput.scrollTop = chatOutput.scrollHeight;
    }, 600);
  }

  // Bind Form Submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    handleQuery(input.value);
  });

  // Bind Suggestion Click
  suggestions.forEach(box => {
    box.addEventListener('click', () => {
      const query = box.getAttribute('data-query');
      handleQuery(query);
    });
  });
}

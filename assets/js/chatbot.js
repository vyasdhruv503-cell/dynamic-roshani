/**
 * RTPL Smart Digital Academy - Animated AI Chatbot Assistant
 * Add this script to index.html and other pages before the closing body tag.
 */

(function () {
  // Chatbot HTML Structure
  const chatbotHtml = `
    <!-- Chatbot Toggle Floating Button -->
    <div id="rtpl-chat-btn" class="fixed bottom-6 right-24 z-40 w-14 h-14 bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-500 hover:scale-105 hover:rotate-6 transition-all flex items-center justify-center cursor-pointer shadow-2xl rounded-full group focus:outline-none select-none">
      <svg id="rtpl-chat-icon" class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 21l5.438-2.331A8.96 8.96 0 0018 18c4.97 0 9-3.582 9-8s-4.03-8-9-8-9 3.582-9 8c0 1.79.65 3.448 1.813 4.904z" />
      </svg>
      <span class="absolute right-16 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">Ask tech AI</span>
    </div>

    <!-- Chatbot Window Interface (tech AI Web App Mode) -->
    <div id="rtpl-chat-window" class="fixed bottom-24 right-6 w-[420px] max-w-[95vw] h-[600px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden hidden transform scale-95 opacity-0 transition-all duration-300 origin-bottom-right">
      
      <!-- Chat Header (tech AI styling) -->
      <div class="p-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <!-- Sparkles/tech AI Star Icon -->
            <svg class="w-6 h-6 text-cyan-300 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l2.4 4.8 5.3.8-3.8 3.7.9 5.3-4.8-2.5-4.8 2.5.9-5.3-3.8-3.7 5.3-.8z" />
            </svg>
          </div>
          <div class="text-left">
            <h4 class="text-sm font-black tracking-tight leading-none">tech AI Workspace</h4>
            <span class="text-[9px] font-bold text-cyan-200 uppercase tracking-widest mt-0.5 inline-block">Official tech AI Integration</span>
          </div>
        </div>
        <button id="rtpl-chat-close" class="p-1 rounded-lg hover:bg-white/10 text-white transition-colors cursor-pointer"><i data-lucide="x" class="w-5 h-5"></i></button>
      </div>

      <!-- Gemini Official Web App Portal (Iframe Container) -->
      <div class="flex-1 w-full h-full bg-slate-50 dark:bg-slate-950 relative">
        <iframe src="https://gemini.google.com/app?hl=en-IN" class="w-full h-full border-none rounded-b-3xl" allow="microphone; geolocation"></iframe>
      </div>
    </div>
  `;

  // Inject into DOM
  document.body.insertAdjacentHTML('beforeend', chatbotHtml);

  // References
  const chatBtn = document.getElementById('rtpl-chat-btn');
  const chatWindow = document.getElementById('rtpl-chat-window');
  const chatClose = document.getElementById('rtpl-chat-close');
  const chatForm = document.getElementById('rtpl-chat-form');
  const chatInput = document.getElementById('rtpl-chat-input');
  const chatMessages = document.getElementById('rtpl-chat-messages');

  // Toggle Visibility Animations
  chatBtn.addEventListener('click', () => {
    const isHidden = chatWindow.classList.contains('hidden');
    if (isHidden) {
      openChat();
    } else {
      closeChat();
    }
  });

  chatClose.addEventListener('click', closeChat);

  function openChat() {
    const isHidden = chatWindow.classList.contains('hidden');
    if (isHidden) {
      chatWindow.classList.remove('hidden');
      setTimeout(() => {
        chatWindow.classList.remove('scale-95', 'opacity-0');
        chatWindow.classList.add('scale-100', 'opacity-100');
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
          window.lucide.createIcons();
        }
      }, 50);
    }
  }

  function closeChat() {
    chatWindow.classList.remove('scale-100', 'opacity-100');
    chatWindow.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
      chatWindow.classList.add('hidden');
    }, 250);
  }

  // Auto pop-up for new session after a 3-second delay
  setTimeout(() => {
    if (!sessionStorage.getItem('rtpl_chat_popped')) {
      openChat();
      sessionStorage.setItem('rtpl_chat_popped', 'true');
    }
  }, 3000);

  // Pre-configured Q&A responses
  const qaDatabase = [
    {
      keywords: ['hello', 'hi', 'hey', 'namaste', 'greetings', 'anyone there', 'hola'],
      response: 'Namaste! 🙏 Welcome to Roshani Technologies. How can I help you today? You can ask about our CAD/BIM courses, fees, timings, or corporate placements.'
    },
    {
      keywords: ['revit', 'bim', 'architecture', 'building information modeling', 'family creation'],
      response: 'Our <b>Autodesk Revit Architecture/Structure/MEP (BIM & Structural Design)</b> course details:<br><br>' +
                '• <b>Duration</b>: 12 Weeks | 36 Modules | 144 Hours (Flexible 1-on-1 slots)<br>' +
                '• <b>Tools Mastered</b>: Revit 2025, Navisworks, BIM 360, AutoCAD Architecture<br>' +
                '• <b>Careers</b>: BIM Coordinator, Revit Modeler, Structural/MEP Engineer, Project Architect<br>' +
                '• <b>Certification</b>: Autodesk Certified Professional — Revit for Architectural Design<br>' +
                '• <b>Syllabus</b>:<br>' +
                '  - <i>Phase 1 (Interface)</i>: BIM concepts, LOD standards, grid lines, compound walls, curtain wall systems.<br>' +
                '  - <i>Phase 2 (Arch Elements)</i>: Compound slabs, roof modeling (slope arrow), custom stairs, railing parameters, rooms.<br>' +
                '  - <i>Phase 3 (Structural BIM)</i>: Columns, framing, foundation/pile caps, area/path rebar, structural links, ETABS/STAAD exports.<br>' +
                '  - <i>Phase 4 (MEP Systems)</i>: HVAC duct zones, plumbing pipe routing (sanitary/water supply), sloped piping, cable trays/conduit, gbXML energy reports.<br>' +
                '  - <i>Phase 5 (Worksharing)</i>: Central model worksharing, model links, shared positioning, cloud worksharing (BIM 360/Autodesk Docs), Navisworks clash checks.<br>' +
                '  - <i>Phase 6 (Documentation)</i>: View types, material schedules/takeoffs, title block revision controls, Enscape live-link rendering, camera flythroughs.'
    },
    {
      keywords: ['autocad', 'cad', '2d drafting', 'civil 3d', 'drafting'],
      response: 'Our <b>Autodesk AutoCAD Studio (CAD, Drafting & Design)</b> course details:<br><br>' +
                '• <b>Duration</b>: 8 Weeks | 24 Modules | 96 Hours (Flexible 1-on-1 slots)<br>' +
                '• <b>Tools Mastered</b>: AutoCAD 2025, AutoCAD LT, AutoCAD Web App<br>' +
                '• <b>Careers</b>: Draftsman, CAD Technician, Design Engineer, Site Supervisor<br>' +
                '• <b>Certification</b>: Autodesk Certified User (ACU) — AutoCAD<br>' +
                '• <b>Syllabus</b>:<br>' +
                '  - <i>Phase 1 (Foundation)</i>: UI customization, WCS/UCS coordinates, precision drafting (OSNAP, polar tracking).<br>' +
                '  - <i>Phase 2 (Editing & Layers)</i>: Modify commands (trim, offset, fillet, chamfer), layer overrides, object properties.<br>' +
                '  - <i>Phase 3 (Annotation)</i>: Dimensions (styles, precision), multileaders, table formulas, linked Excel data, auto-fields.<br>' +
                '  - <i>Phase 4 (Blocks & Xrefs)</i>: Dynamic blocks (parameters, actions, visibility states), attribute data extraction, Xrefs, parametric constraints.<br>' +
                '  - <i>Phase 5 (Layouts & 3D)</i>: Paper space layouts, viewports, CTB/STB plotting, multi-sheet PDF batch plotting, 3D solid basics.'
    },
    {
      keywords: ['solidworks', 'mechanical model', 'assembly', 'sheet metal'],
      response: 'Our <b>SolidWorks — Parametric Design & Simulation</b> course details:<br><br>' +
                '• <b>Duration</b>: 10 Weeks | 30 Modules | 120 Hours (Flexible 1-on-1 slots)<br>' +
                '• <b>Tools Mastered</b>: SolidWorks 2024, SolidWorks Simulation, SolidWorks CAM, eDrawings<br>' +
                '• <b>Careers</b>: Mechanical Design Engineer, Product Designer, Tooling/Manufacturing Engineer<br>' +
                '• <b>Certification</b>: Certified SolidWorks Associate (CSWA) / Professional (CSWP)<br>' +
                '• <b>Syllabus</b>:<br>' +
                '  - <i>Phase 1 (Part Modeling)</i>: Command manager, sketches, loft/sweep features, ANSI/ISO Hole Wizards, material designs.<br>' +
                '  - <i>Phase 2 (Assembly)</i>: Bottom-up/top-down setups, mechanical mates (cam, gear, screw), motion study physics.<br>' +
                '  - <i>Phase 3 (Sheet Metal & Weldments)</i>: Miter flanges, bend calculations (K-Factor), weldment structural profiles, cut lists.<br>' +
                '  - <i>Phase 4 (Simulation)</i>: Static stress FEA, fixtures (hinge, elastic), Von Mises maps, fatigue lifecycles, thermal boundary checks.<br>' +
                '  - <i>Phase 5 (Drawings & CAM)</i>: Projected section sheets, GD&T Datums, Photoview rendering, 2.5D milling toolpaths.'
    },
    {
      keywords: ['catia', 'surface model'],
      response: 'Our <b>CATIA V5 — Advanced Engineering (Mechanical & Aerospace)</b> course details:<br><br>' +
                '• <b>Duration</b>: 14 Weeks | 42 Modules | 168 Hours (Flexible 1-on-1 slots)<br>' +
                '• <b>Tools Mastered</b>: CATIA V5 R28, ENOVIA VPM, DELMIA, SIMULIA Abaqus<br>' +
                '• <b>Careers</b>: Mechanical Design Engineer, Aerospace/Automotive Engineer, Surface Modeler, PLM Consultant<br>' +
                '• <b>Certification</b>: Dassault Systèmes CATIA Certified Associate (CCA)<br>' +
                '• <b>Syllabus</b>:<br>' +
                '  - <i>Phase 1 (Part Design)</i>: Spec tree, constraints, Boolean operations (Add, Remove, Intersect), multi-section solids (lofts), fillets/drafts.<br>' +
                '  - <i>Phase 2 (Assembly & DMU)</i>: Assembly constraints, Digital Mockup Navigator, interference/clearance tests, DMU Fitting simulator, GD&T stackups.<br>' +
                '  - <i>Phase 3 (Generative Shape Design)</i>: Wireframe, sweeps, surface blends, lofts, shape morphing (deformations), Class-A zebra/inflection checks.<br>' +
                '  - <i>Phase 4 (Sheet Metal & Kinematics)</i>: Sheet metal flange parameters, flat pattern unfolding (DXF export), kinematics joint simulators (revolute, prismatic, gear), collision reports.<br>' +
                '  - <i>Phase 5 (FEA & Drafting)</i>: GPS structural meshes, material assignments, Von Mises stress maps, drafting projections, PLM ENOVIA vaulting.'
    },
    {
      keywords: ['fusion', 'cloud cad'],
      response: 'Our <b>Autodesk Fusion 360 (Cloud CAD / CAM / CAE)</b> course details:<br><br>' +
                '• <b>Duration</b>: 10 Weeks | 30 Modules | 120 Hours (Flexible 1-on-1 slots)<br>' +
                '• <b>Tools Mastered</b>: Fusion 360, Autodesk Drive, Eagle PCB, HSMWorks<br>' +
                '• <b>Careers</b>: Product Designer, CNC Programmer, Prototype Engineer, 3D Printing Specialist<br>' +
                '• <b>Certification</b>: Autodesk Certified Professional — Fusion 360<br>' +
                '• <b>Syllabus</b>:<br>' +
                '  - <i>Phase 1 (Cloud & Sketch)</i>: Cloud hub collaboration, versioning, driven dimensions, global parameters.<br>' +
                '  - <i>Phase 2 (Solid & Sculpt)</i>: Parametric solid lofts, surface patches, T-Splines sculpt workspaces (push/pull), mesh editing (STL/OBJ).<br>' +
                '  - <i>Phase 3 (Joint Assembly)</i>: Top-down/bottom-up layouts, joint motions (rigid, slider, pin-slot, ball), contact sets, BOM generation.<br>' +
                '  - <i>Phase 4 (CAM Programming)</i>: Machine configuration, 2D/3D adaptive clearing, pocket milling, CNC post-processing (Fanuc, Haas, GRBL, Siemens G-Code).<br>' +
                '  - <i>Phase 5 (Simulation & AI)</i>: Static stress, modal frequency FEA, generative design AI outcomes, 3D print beds.'
    },
    {
      keywords: ['lumion', 'rendering', 'render', 'cgi', 'visuals', 'sketchup', 'max', 'maya', 'rhinoceros', 'grasshopper', 'v-ray', 'enscape'],
      response: 'Our <b>Architectural Rendering & Visualization Portfolio</b> courses details:<br><br>' +
                '1️⃣ <b>Trimble SketchUp Pro</b> (8 Weeks | 96 Hours): Master Push/Pull, Dynamic Components parameters, 3D Warehouse optimization, solid tools, Curviloft/Artisan plugins, V-Ray, and LayOut viewport scale sheets.<br><br>' +
                '2️⃣ <b>Lumion 3D Professional</b> (8 Weeks | 96 Hours): LiveSync importing, terrain daylighting, custom PBR material mapping, Spotlight IES profiles, camera tilt-shift renders, daylight time-lapse animations up to 8K.<br><br>' +
                '3️⃣ <b>Autodesk 3ds Max</b> (10 Weeks | 120 Hours): Editable Poly sub-object modeling, Slate Material editor, V-Ray/Arnold/Corona domes, VRay Physical Camera parameters, Forest Pack/RailClone scatters.'
    },
    {
      keywords: ['partner', 'authorized', 'autodesk reseller', 'certificate', 'certification'],
      response: 'Roshani Technologies is an <b>Authorized Autodesk Reseller and Training Partner</b>, Autodesk Authorized Training/Certification Center, and a <b>Dassault Systemes Partner</b>. You receive official credentials and Autodesk digital badges upon completion.'
    },
    {
      keywords: ['placement', 'job', 'recruit', 'salary', 'career', 'hire', 'work'],
      response: 'We offer <b>100% Placement assistance</b> and have successfully placed over <b>25,000+ engineers</b> in various industries!'
    },
    {
      keywords: ['fee', 'fees', 'cost', 'price', 'payment', 'charges', 'discount'],
      response: 'Our course fees depend on the specific training program or professional package (e.g., AutoCAD, Revit, SolidWorks). Please send an inquiry from our <a href="contact.html" class="text-sky-400 underline font-bold">Contact Page</a> or call 📞 +91 94087 88205 to receive custom pricing options!'
    },
    {
      keywords: ['duration', 'time', 'timing', 'batch', 'schedule', 'hours', 'open'],
      response: '<b>We do not run batch classes!</b> We offer 1-on-1 personalized mentoring with fully flexible timings. You can book classes at your convenience Monday to Saturday between <b>7:00 AM and 10:00 PM</b>. Training continues "Till you learn the software to your satisfaction".'
    },
    {
      keywords: ['all course', 'all courses', 'list courses', 'what courses', 'which courses', 'classes', 'subject', 'subjects', 'syllabus', 'programs'],
      response: 'Roshani Technologies offers over <b>60+ certified corporate courses</b>! Primary divisions include:<br><br>' +
                '1️⃣ <b>BIM & Civil/Arch</b>: Revit, AutoCAD Civil 3D, Navisworks Manage, Tekla Structure.<br>' +
                '2️⃣ <b>Mechanical CAD</b>: SolidWorks, CATIA, Inventor Professional, Fusion 360, Nastran, ANSYS, Siemens NX, Creo.<br>' +
                '3️⃣ <b>Interior & Rendering</b>: Trimble SketchUp, Lumion 3D, V-Ray, 3DS Max, TwinMotion, D5 Rendering.<br>' +
                '4️⃣ <b>Programming & Graphic Design</b>: Photoshop, Illustrator, InDesign, CorelDraw, Tally with GST, C, C++, Java, Python, Digital Marketing.<br>' +
                '5️⃣ <b>Entrance Test Prep</b>: NATA, NID, UCEED.<br><br>' +
                'Which field are you interested in?'
    },
    {
      keywords: ['contact', 'phone', 'call', 'whatsapp', 'address', 'office', 'location', 'where'],
      response: '📍 <b>Corporate Head Office</b>: Technology Park-Roshani, Near Karelibaug Water Tank, Vadodara, Gujarat.<br>' +
                '📞 <b>Admissions Desk</b>: +91 94087 88205 (CEO Nachiket D. Shah) or +91 93758 05150 (Director Dipak O. Shah).'
    },
    {
      keywords: ['aec', 'civil 3d', 'staad', 'structural', 'piping', 'infrastructure'],
      response: 'Our <b>AEC (Architecture, Engineering & Construction)</b> course details:<br><br>' +
                '1️⃣ <b>AutoCAD Civil 3D (Infrastructure Design)</b> (10 Weeks | 120 Hours): TIN surface building, horizontal alignments compliance (IRC/MoRTH), Assembly corridor modeling, gravity sloped pipe networks, and grading.<br><br>' +
                '2️⃣ <b>STAAD.Pro (Structural Analysis)</b> (8 Weeks | 96 Hours): Steel catalogs (IS/AISC), IS 1893:2016 response spectrum load cases, IS 456 columns/footings design, IS 800 steel PEB frame calculations.<br><br>' +
                '3️⃣ <b>NAV NIRMAN (BIM Management)</b> (16 Weeks | 192 Hours): ISO 19650 standard, advanced BIM Execution Plans, LOD 100-500 project setups, Navisworks federated clash detection, 4D Scheduling, 5D Cost takeoff, point-cloud as-builts, and COBie twins.'
    }
  ];

  // Helper to fetch response from Express endpoint
  function fetchBotReply(query, callback) {
    const isLocalHost = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' || 
                        window.location.protocol === 'file:' || 
                        window.location.hostname.startsWith('192.168.') || 
                        window.location.hostname.startsWith('10.') || 
                        window.location.hostname.startsWith('172.');
    const host = window.location.hostname || 'localhost';
    const apiHost = isLocalHost
      ? `http://${host}:3000`
      : 'https://dynamic-roshani.onrender.com';
      
    fetch(`${apiHost}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({ query, activeTopic: activeSessionTopic })
    })
    .then(res => res.json())
    .then(data => {
      if (data && data.reply) {
        callback(data.reply);
      } else {
        // Fallback to local Q&A engine
        callback(getAIResponse(query));
      }
    })
    .catch(() => {
      // Offline fallback to local Q&A engine
      callback(getAIResponse(query));
    });
  }

  // Send message handler
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = chatInput.value.trim();
    if (!query) return;

    appendMessage(query, 'user');
    chatInput.value = '';

    // Typing loading animation
    appendTypingIndicator();

    fetchBotReply(query, (reply) => {
      removeTypingIndicator();
      appendMessage(reply, 'bot');
    });
  });

  // Suggestion Badges click handler
  document.querySelectorAll('#rtpl-chat-window .chat-suggest-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const query = btn.textContent;
      appendMessage(query, 'user');
      appendTypingIndicator();
      
      fetchBotReply(query, (reply) => {
        removeTypingIndicator();
        appendMessage(reply, 'bot');
      });
    });
  });

  function appendMessage(text, sender) {
    const isBot = sender === 'bot';
    const msg = document.createElement('div');
    msg.className = `flex items-start gap-2.5 max-w-[85%] text-left ${isBot ? '' : 'ml-auto flex-row-reverse'}`;

    // Convert markdown formatting symbols to HTML tags (**bold** and lists)
    let formattedText = text;
    if (isBot) {
      formattedText = formattedText
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') // **bold** -> <b>
        .replace(/\*(.*?)\*/g, '<i>$1</i>')   // *italic* -> <i>
        .replace(/`([^`]+)`/g, '<code class="bg-slate-100 dark:bg-slate-800 px-1 rounded font-mono">$1</code>') // `code`
        .replace(/\n/g, '<br>');               // newline -> <br>
    }

    const botAvatar = `
      <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 text-white flex items-center justify-center flex-shrink-0 border border-indigo-500/20 shadow-sm">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l2.4 4.8 5.3.8-3.8 3.7.9 5.3-4.8-2.5-4.8 2.5.9-5.3-3.8-3.7 5.3-.8z" />
        </svg>
      </div>
    `;

    const userAvatar = `
      <div class="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 flex items-center justify-center flex-shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm">
        <i data-lucide="user" class="w-4 h-4"></i>
      </div>
    `;

    msg.innerHTML = `
      ${isBot ? botAvatar : userAvatar}
      <div class="p-3 rounded-2xl border shadow-sm leading-relaxed font-semibold ${isBot ? 'bg-white dark:bg-slate-850 border-slate-100 dark:border-slate-800 rounded-tl-none text-slate-700 dark:text-slate-350' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-indigo-500/20 rounded-tr-none'}">
        ${formattedText}
      </div>
    `;

    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  function appendTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'rtpl-chat-typing';
    indicator.className = 'flex items-start gap-2.5 max-w-[85%] text-left';
    indicator.innerHTML = `
      <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 text-white flex items-center justify-center flex-shrink-0 border border-indigo-500/20 shadow-sm">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l2.4 4.8 5.3.8-3.8 3.7.9 5.3-4.8-2.5-4.8 2.5.9-5.3-3.8-3.7 5.3-.8z" />
        </svg>
      </div>
      <div class="p-3 bg-white dark:bg-slate-850 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-1">
        <span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
        <span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
        <span class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
      </div>
    `;
    chatMessages.appendChild(indicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  function removeTypingIndicator() {
    const el = document.getElementById('rtpl-chat-typing');
    if (el) el.remove();
  }

  let activeSessionTopic = null;

  function getAIResponse(query) {
    const cleanQuery = query.toLowerCase();
    
    // Support Contextual Follow-up (e.g. "give me more details" / "more info" / "details please")
    const contextualWords = ['more detail', 'more details', 'details please', 'explain more', 'tell me more', 'detail please', 'provide details'];
    const isContextualFollowup = contextualWords.some(w => cleanQuery.includes(w));
    
    if (isContextualFollowup && activeSessionTopic) {
      if (activeSessionTopic === 'revit') {
        return 'Revit Architecture training spans **4 to 12 weeks** under 1-on-1 expert guidance. Topics cover conceptual design, elevations, construction documents, scheduling tables, and 3D realistic rendering. Would you like to check the course syllabus?';
      }
      if (activeSessionTopic === 'autocad') {
        return 'AutoCAD courses focus on 2D drafting coordinates, block layouts, structural detailing, scale settings, annotations, and exporting standard architectural drawings. You can learn AutoCAD Mechanical or Civil 3D!';
      }
      if (activeSessionTopic === 'mechanical') {
        return 'SolidWorks, CATIA, and Fusion 360 lessons cover advanced parametric part modeling, assembly logic, draft layouts, sheet metal modeling, and mechanical simulation stress testing.';
      }
      if (activeSessionTopic === 'partner') {
        return 'As an Autodesk Partner, we provide authentic Autodesk course certificates and global credentials that add massive value to your professional portfolio and resume.';
      }
      if (activeSessionTopic === 'placement') {
        return 'Our placement wing schedules direct placement interviews for certified students. Average salary packages range from **₹2.5L to ₹6L per year** depending on software certification levels.';
      }
      if (activeSessionTopic === 'duration') {
        return 'Because there are no strict batch systems, you can book slots anytime between **8:00 AM and 8:00 PM (Mon-Sat)**. You can complete the course faster by coming in for extra hours.';
      }
    }

    let bestMatch = null;
    let highestScore = 0;

    // Find best match in database based on matched keyword counts
    for (let db of qaDatabase) {
      let currentScore = 0;
      for (let keyword of db.keywords) {
        if (cleanQuery.includes(keyword)) {
          // Give higher weights to specific terms like "revit" over generic ones like "fees"
          currentScore += keyword.length > 3 ? 2 : 1;
        }
      }
      if (currentScore > highestScore) {
        highestScore = currentScore;
        bestMatch = db;
      }
    }

    if (bestMatch && highestScore > 0) {
      // Set active topic based on matched tags
      if (bestMatch.keywords.includes('revit')) activeSessionTopic = 'revit';
      else if (bestMatch.keywords.includes('autocad')) activeSessionTopic = 'autocad';
      else if (bestMatch.keywords.includes('solidworks')) activeSessionTopic = 'mechanical';
      else if (bestMatch.keywords.includes('partner')) activeSessionTopic = 'partner';
      else if (bestMatch.keywords.includes('placement')) activeSessionTopic = 'placement';
      else if (bestMatch.keywords.includes('duration')) activeSessionTopic = 'duration';

      return bestMatch.response;
    }
    
    // Fallback response
    return "I'm sorry, I didn't quite catch that. Could you please specify a course (e.g. AutoCAD, Revit, SolidWorks) or ask about our fees, placements, and timings?";
  }
})();

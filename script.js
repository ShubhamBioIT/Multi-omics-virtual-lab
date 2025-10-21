/* =============================================================================
   Virtual Multi-Omics Gene Regulation & Disease Prediction Lab - JavaScript
   
   Author: Shubham Mahindrakar
   Description: Complete simulation engine for multi-omics analysis
   
   HOW TO RUN:
   1. Save index.html, style.css, and script.js in the same folder
   2. Open index.html in any modern web browser
   3. No server required - runs entirely client-side
   
   HOW TO CUSTOMIZE:
   - Add genes: Modify the GENE_DATABASE constant (line ~50)
   - Add diseases: Modify the DISEASE_DATABASE constant (line ~150)
   - Adjust simulation: Modify SIMULATION_CONFIG constant (line ~250)
   
   ARCHITECTURE:
   - State management: Central state object tracks all parameters
   - Event-driven: Listeners update state and trigger re-renders
   - Modular: Separate functions for calculation, rendering, and I/O
   
   ============================================================================= */

'use strict';

// Check if Chart.js is loaded
if (typeof Chart === 'undefined') {
    console.error('Chart.js failed to load! Please check your internet connection and CDN link.');
    alert('Chart.js library failed to load. Please refresh the page or check your internet connection.');
    throw new Error('Chart.js not loaded');
}

console.log('Chart.js loaded successfully! Version:', Chart.version);

// ... rest of your code


// =============================================================================
// 1. CONSTANTS & CONFIGURATION
// =============================================================================

/**
 * Gene Database - Realistic human genes with baseline expression parameters
 */
const GENE_DATABASE = [
    {
        symbol: 'TP53',
        name: 'Tumor Protein P53',
        description: 'Tumor suppressor gene; guardian of the genome. Mutated in >50% of human cancers. Regulates cell cycle and apoptosis.',
        baselineTPM: 45.2,
        Vmax: 100.0,
        baselineProtein: 320.5,
        defaultEta: 0.7
    },
    {
        symbol: 'BRCA1',
        name: 'Breast Cancer 1',
        description: 'DNA repair protein; mutations increase breast/ovarian cancer risk. Critical for homologous recombination.',
        baselineTPM: 12.8,
        Vmax: 80.0,
        baselineProtein: 95.3,
        defaultEta: 0.75
    },
    {
        symbol: 'EGFR',
        name: 'Epidermal Growth Factor Receptor',
        description: 'Receptor tyrosine kinase; frequently amplified in cancers. Target of multiple cancer therapies.',
        baselineTPM: 67.4,
        Vmax: 150.0,
        baselineProtein: 485.7,
        defaultEta: 0.72
    },
    {
        symbol: 'APOE',
        name: 'Apolipoprotein E',
        description: 'Lipid metabolism and transport protein. APOE4 variant is major genetic risk factor for Alzheimer\'s disease.',
        baselineTPM: 234.6,
        Vmax: 300.0,
        baselineProtein: 1850.2,
        defaultEta: 0.79
    },
    {
        symbol: 'INS',
        name: 'Insulin',
        description: 'Peptide hormone regulating glucose metabolism. Deficiency/resistance causes diabetes mellitus.',
        baselineTPM: 8900.5,
        Vmax: 10000.0,
        baselineProtein: 65000.0,
        defaultEta: 0.73
    },
    {
        symbol: 'IL6',
        name: 'Interleukin 6',
        description: 'Pro-inflammatory cytokine; elevated in chronic inflammation, autoimmune diseases, and cancer.',
        baselineTPM: 28.3,
        Vmax: 120.0,
        baselineProtein: 215.8,
        defaultEta: 0.76
    },
    {
        symbol: 'TNF',
        name: 'Tumor Necrosis Factor Alpha',
        description: 'Key inflammatory cytokine; mediates immune response. Dysregulation linked to autoimmune diseases.',
        baselineTPM: 42.7,
        Vmax: 130.0,
        baselineProtein: 298.4,
        defaultEta: 0.70
    },
    {
        symbol: 'GAPDH',
        name: 'Glyceraldehyde-3-Phosphate Dehydrogenase',
        description: 'Housekeeping gene; glycolysis enzyme. Commonly used as reference gene in expression studies.',
        baselineTPM: 1245.8,
        Vmax: 1500.0,
        baselineProtein: 9850.3,
        defaultEta: 0.79
    },
    {
        symbol: 'VEGFA',
        name: 'Vascular Endothelial Growth Factor A',
        description: 'Angiogenesis regulator; promotes blood vessel formation. Overexpressed in tumors and cardiovascular disease.',
        baselineTPM: 87.2,
        Vmax: 180.0,
        baselineProtein: 625.9,
        defaultEta: 0.72
    },
    {
        symbol: 'MYC',
        name: 'MYC Proto-Oncogene',
        description: 'Transcription factor controlling cell proliferation. Amplified/overexpressed in many cancers.',
        baselineTPM: 56.3,
        Vmax: 140.0,
        baselineProtein: 412.7,
        defaultEta: 0.73
    }
];

/**
 * Disease Database - Human diseases with gene association weights
 */
const DISEASE_DATABASE = [
    {
        name: 'Breast Cancer',
        description: 'Malignant tumor of breast tissue. Associated with BRCA1/2 mutations and hormone signaling.',
        geneWeights: {
            'TP53': 0.8,
            'BRCA1': -0.9,
            'EGFR': 0.7,
            'APOE': 0.1,
            'INS': 0.2,
            'IL6': 0.5,
            'TNF': 0.4,
            'GAPDH': 0.0,
            'VEGFA': 0.6,
            'MYC': 0.8
        },
        bias: -1.5  // CHANGED from -2.5 to -1.5
    },
    {
        name: 'Alzheimer\'s Disease',
        description: 'Progressive neurodegenerative disorder; characterized by amyloid plaques and neurofibrillary tangles.',
        geneWeights: {
            'TP53': 0.3,
            'BRCA1': 0.1,
            'EGFR': 0.2,
            'APOE': 0.9,
            'INS': -0.4,
            'IL6': 0.6,
            'TNF': 0.5,
            'GAPDH': 0.0,
            'VEGFA': 0.3,
            'MYC': 0.1
        },
        bias: -1.8  // CHANGED from -3.0 to -1.8
    },
    {
        name: 'Type 2 Diabetes',
        description: 'Metabolic disorder characterized by insulin resistance and hyperglycemia.',
        geneWeights: {
            'TP53': 0.2,
            'BRCA1': 0.0,
            'EGFR': 0.3,
            'APOE': 0.4,
            'INS': -0.9,
            'IL6': 0.7,
            'TNF': 0.7,
            'GAPDH': 0.0,
            'VEGFA': 0.4,
            'MYC': 0.2
        },
        bias: -1.6  // CHANGED from -2.8 to -1.6
    },
    {
        name: 'Chronic Inflammation',
        description: 'Persistent inflammatory state; associated with autoimmune diseases and cancer.',
        geneWeights: {
            'TP53': 0.4,
            'BRCA1': 0.1,
            'EGFR': 0.5,
            'APOE': 0.3,
            'INS': 0.2,
            'IL6': 0.9,
            'TNF': 0.9,
            'GAPDH': 0.0,
            'VEGFA': 0.5,
            'MYC': 0.4
        },
        bias: -1.2  // CHANGED from -2.2 to -1.2
    },
    {
        name: 'Cardiovascular Disease',
        description: 'Heart and blood vessel disorders; includes atherosclerosis, heart attack, and stroke.',
        geneWeights: {
            'TP53': 0.3,
            'BRCA1': 0.1,
            'EGFR': 0.4,
            'APOE': 0.7,
            'INS': 0.5,
            'IL6': 0.6,
            'TNF': 0.6,
            'GAPDH': 0.0,
            'VEGFA': 0.8,
            'MYC': 0.3
        },
        bias: -1.4  // CHANGED from -2.6 to -1.4
    },
    {
        name: 'Lung Cancer',
        description: 'Malignant lung tumor; often associated with smoking and EGFR mutations.',
        geneWeights: {
            'TP53': 0.9,
            'BRCA1': 0.3,
            'EGFR': 0.9,
            'APOE': 0.2,
            'INS': 0.2,
            'IL6': 0.5,
            'TNF': 0.4,
            'GAPDH': 0.0,
            'VEGFA': 0.7,
            'MYC': 0.8
        },
        bias: -1.3  // CHANGED from -2.7 to -1.3
    }
];

/**
 * Simulation Configuration
 */
const SIMULATION_CONFIG = {
    timeStep: 0.1,
    maxTime: 50.0,
    updateInterval: 50,
    chartMaxPoints: 200
};

const PRESET_SCENARIOS = {
    healthy: {
        name: 'Healthy State',
        params: {
            tfConcentration: 50,
            bindingAffinity: 1,
            hillCoefficient: 2,
            methylationFactor: 0,
            mutationSeverity: 0,
            translationEfficiency: 0.7,
            proteinDegradation: 0.1,
            expressionNoise: 0.05,
            weightGenomics: 0.3,
            weightTranscriptomics: 0.4,
            weightProteomics: 0.3
        }
    },
    'high-risk': {
        name: 'High Disease Risk',
        params: {
            tfConcentration: 300,      // INCREASED from 150
            bindingAffinity: 0.2,      // DECREASED from 0.5 (stronger binding)
            hillCoefficient: 3,
            methylationFactor: 0.5,    // INCREASED from 0.3
            mutationSeverity: 0.8,     // INCREASED from 0.6
            translationEfficiency: 0.3, // DECREASED from 0.4
            proteinDegradation: 0.4,   // INCREASED from 0.3
            expressionNoise: 0.3,      // INCREASED from 0.2
            weightGenomics: 0.4,
            weightTranscriptomics: 0.3,
            weightProteomics: 0.3
        }
    },
    'drug-treated': {
        name: 'Drug Treatment',
        params: {
            tfConcentration: 30,
            bindingAffinity: 2,
            hillCoefficient: 2,
            methylationFactor: 0.05,   // DECREASED from 0.1
            mutationSeverity: 0.1,     // DECREASED from 0.2
            translationEfficiency: 2.0, // INCREASED from 1.5
            proteinDegradation: 0.05,
            expressionNoise: 0.08,
            weightGenomics: 0.3,
            weightTranscriptomics: 0.4,
            weightProteomics: 0.3
        }
    },
    'epigenetic-silenced': {
        name: 'Epigenetic Silencing',
        params: {
            tfConcentration: 80,
            bindingAffinity: 1,
            hillCoefficient: 2,
            methylationFactor: 0.9,    // INCREASED from 0.7
            mutationSeverity: 0.3,     // INCREASED from 0.1
            translationEfficiency: 0.4, // DECREASED from 0.6
            proteinDegradation: 0.25,  // INCREASED from 0.15
            expressionNoise: 0.2,      // INCREASED from 0.1
            weightGenomics: 0.6,       // INCREASED from 0.5
            weightTranscriptomics: 0.25, // DECREASED from 0.3
            weightProteomics: 0.15     // DECREASED from 0.2
        }
    },
    'tf-overexpression': {
        name: 'TF Overexpression (Cancer Model)',
        params: {
            tfConcentration: 800,      // INCREASED from 500
            bindingAffinity: 0.1,      // DECREASED from 0.3
            hillCoefficient: 4,        // INCREASED from 3
            methylationFactor: 0.0,
            mutationSeverity: 0.6,     // INCREASED from 0.4
            translationEfficiency: 1.2, // INCREASED from 0.9
            proteinDegradation: 0.03,  // DECREASED from 0.05
            expressionNoise: 0.2,      // INCREASED from 0.15
            weightGenomics: 0.3,
            weightTranscriptomics: 0.3,
            weightProteomics: 0.4
        }
    }
};


/**
 * Detailed Scenario Configurations with auto-fill data
 */
const DETAILED_SCENARIOS = {
    healthy: {
        name: 'Healthy State',
        icon: '✅',
        riskLevel: 'Low Risk ~10%',
        riskClass: 'low',
        description: 'This scenario represents a healthy individual with normal gene regulation, balanced transcription factor activity, and no significant genetic or epigenetic abnormalities. All cellular processes function optimally.',
        clinicalContext: 'Represents baseline health with low disease susceptibility. Suitable for understanding normal biological function and as a control for comparison with disease states.',
        selectedGenes: ['TP53', 'BRCA1', 'GAPDH'],
        selectedDiseases: ['Breast Cancer', 'Cardiovascular Disease'],
        params: {
            tfConcentration: 50,
            bindingAffinity: 1.0,
            hillCoefficient: 2,
            methylationFactor: 0.0,
            mutationSeverity: 0.0,
            translationEfficiency: 0.75,
            proteinDegradation: 0.1,
            expressionNoise: 0.05,
            weightGenomics: 0.3,
            weightTranscriptomics: 0.4,
            weightProteomics: 0.3
        },
        keyFeatures: [
            '✓ Normal TF concentration (50 nM)',
            '✓ No mutations or epigenetic silencing',
            '✓ Balanced protein synthesis and degradation',
            '✓ Minimal biological noise'
        ]
    },
    
    cancer: {
        name: 'Cancer Model (High Risk)',
        icon: '🔴',
        riskLevel: 'High Risk ~75%',
        riskClass: 'high',
        description: 'Models aggressive cancer with TP53 tumor suppressor mutations, EGFR receptor overexpression, and MYC oncogene amplification. Characterized by uncontrolled cell proliferation and disrupted apoptosis.',
        clinicalContext: 'Simulates advanced stage cancer (breast, lung) with multiple oncogenic drivers. High TF activity mimics growth factor signaling dysregulation commonly seen in tumors.',
        selectedGenes: ['TP53', 'EGFR', 'MYC', 'BRCA1'],
        selectedDiseases: ['Breast Cancer', 'Lung Cancer'],
        params: {
            tfConcentration: 750,
            bindingAffinity: 0.15,
            hillCoefficient: 4,
            methylationFactor: 0.0,
            mutationSeverity: 0.85,
            translationEfficiency: 1.3,
            proteinDegradation: 0.04,
            expressionNoise: 0.25,
            weightGenomics: 0.35,
            weightTranscriptomics: 0.35,
            weightProteomics: 0.3
        },
        keyFeatures: [
            '⚠️ Very high TF concentration (750 nM) - growth factor overactivation',
            '⚠️ Strong TF binding (Kd = 0.15 µM) - sustained signaling',
            '⚠️ High mutation severity (0.85) - TP53 loss of function',
            '⚠️ Low protein degradation - oncoproteins accumulate'
        ]
    },
    
    'drug-treatment': {
        name: 'Drug Treatment Response',
        icon: '💊',
        riskLevel: 'Low Risk ~15%',
        riskClass: 'low',
        description: 'Simulates successful therapeutic intervention with targeted drugs that enhance protein synthesis of tumor suppressors, reduce oncogenic signaling, and restore normal cellular regulation.',
        clinicalContext: 'Represents response to combination therapy (e.g., tyrosine kinase inhibitors + epigenetic modulators). Demonstrates how drugs can shift high-risk profiles toward healthier states.',
        selectedGenes: ['TP53', 'BRCA1', 'EGFR', 'IL6'],
        selectedDiseases: ['Breast Cancer', 'Chronic Inflammation'],
        params: {
            tfConcentration: 30,
            bindingAffinity: 2.5,
            hillCoefficient: 2,
            methylationFactor: 0.05,
            mutationSeverity: 0.1,
            translationEfficiency: 2.2,
            proteinDegradation: 0.06,
            expressionNoise: 0.07,
            weightGenomics: 0.25,
            weightTranscriptomics: 0.4,
            weightProteomics: 0.35
        },
        keyFeatures: [
            '✓ Reduced TF activity (30 nM) - normalized signaling',
            '✓ Enhanced translation (η = 2.2) - drug-boosted protein production',
            '✓ Minimal mutations & methylation - therapeutic correction',
            '✓ Low noise - stable cellular environment'
        ]
    },
    
    inflammation: {
        name: 'Chronic Inflammation',
        icon: '🔥',
        riskLevel: 'Moderate Risk ~55%',
        riskClass: 'moderate',
        description: 'Models persistent inflammatory state with elevated IL6 and TNF cytokines. Chronic inflammation is a major risk factor for cancer, cardiovascular disease, and autoimmune disorders.',
        clinicalContext: 'Represents conditions like rheumatoid arthritis, inflammatory bowel disease, or metabolic syndrome. Elevated inflammatory cytokines create a pro-tumorigenic microenvironment.',
        selectedGenes: ['IL6', 'TNF', 'EGFR', 'VEGFA'],
        selectedDiseases: ['Chronic Inflammation', 'Cardiovascular Disease'],
        params: {
            tfConcentration: 420,
            bindingAffinity: 0.4,
            hillCoefficient: 3,
            methylationFactor: 0.25,
            mutationSeverity: 0.45,
            translationEfficiency: 1.4,
            proteinDegradation: 0.12,
            expressionNoise: 0.18,
            weightGenomics: 0.3,
            weightTranscriptomics: 0.45,
            weightProteomics: 0.25
        },
        keyFeatures: [
            '⚠️ Elevated TF concentration (420 nM) - inflammatory signaling',
            '⚠️ IL6/TNF overexpression - cytokine storm',
            '⚠️ Moderate mutations (0.45) - inflammation-induced DNA damage',
            '⚠️ High translation efficiency - cytokine amplification'
        ]
    },
    
    alzheimers: {
        name: 'Alzheimer\'s Disease Risk',
        icon: '🧠',
        riskLevel: 'Moderate Risk ~60%',
        riskClass: 'moderate',
        description: 'Models Alzheimer\'s disease with APOE4 genetic risk variant, neuroinflammation, and progressive neurodegeneration. Characterized by amyloid-beta accumulation and tau protein pathology.',
        clinicalContext: 'Simulates late-onset Alzheimer\'s with APOE4/4 genotype (highest genetic risk). Combines genetic predisposition with age-related neuroinflammatory changes.',
        selectedGenes: ['APOE', 'IL6', 'TNF', 'TP53'],
        selectedDiseases: ['Alzheimer\'s Disease'],
        params: {
            tfConcentration: 340,
            bindingAffinity: 0.6,
            hillCoefficient: 3,
            methylationFactor: 0.55,
            mutationSeverity: 0.65,
            translationEfficiency: 0.5,
            proteinDegradation: 0.32,
            expressionNoise: 0.22,
            weightGenomics: 0.45,
            weightTranscriptomics: 0.3,
            weightProteomics: 0.25
        },
        keyFeatures: [
            '⚠️ APOE4 genetic variant - impaired lipid metabolism',
            '⚠️ High methylation (0.55) - epigenetic aging',
            '⚠️ High degradation (0.32) - protein misfolding & clearance',
            '⚠️ Neuroinflammation - IL6/TNF activation'
        ]
    }
};

/**
 * Show scenario modal with detailed information
 */
function showScenarioModal(scenarioKey) {
    const scenario = DETAILED_SCENARIOS[scenarioKey];
    if (!scenario) return;
    
    const modal = document.getElementById('scenario-modal');
    const modalBody = document.getElementById('scenario-modal-body');
    
    // Generate genes list HTML
    const genesHTML = scenario.selectedGenes.map(gene => 
        `<span class="modal-gene-badge">${gene}</span>`
    ).join('');
    
    // Generate diseases list HTML
    const diseasesHTML = scenario.selectedDiseases.map(disease => 
        `<span class="modal-disease-badge">${disease}</span>`
    ).join('');
    
    // Generate key features HTML
    const featuresHTML = scenario.keyFeatures.map(feature => 
        `<li>${feature}</li>`
    ).join('');
    
    // Populate modal
    modalBody.innerHTML = `
        <div class="modal-header">
            <div class="modal-icon">${scenario.icon}</div>
            <h2 class="modal-title">${scenario.name}</h2>
            <div class="modal-risk-badge ${scenario.riskClass}">${scenario.riskLevel}</div>
        </div>
        
        <div class="modal-description">
            <strong>📋 Overview:</strong> ${scenario.description}
        </div>
        
        <div class="modal-section">
            <h3 class="modal-section-title">🏥 Clinical Context</h3>
            <p style="color: var(--text-secondary); line-height: 1.7;">${scenario.clinicalContext}</p>
        </div>
        
        <div class="modal-section">
            <h3 class="modal-section-title">🧬 Selected Genes</h3>
            <div class="modal-genes-list">${genesHTML}</div>
        </div>
        
        <div class="modal-section">
            <h3 class="modal-section-title">⚕️ Target Diseases</h3>
            <div class="modal-diseases-list">${diseasesHTML}</div>
        </div>
        
        <div class="modal-section">
            <h3 class="modal-section-title">⚙️ Key Parameters</h3>
            <div class="modal-params-grid">
                <div class="modal-param-item">
                    <div class="modal-param-name">TF Concentration</div>
                    <div class="modal-param-value">${scenario.params.tfConcentration} nM</div>
                </div>
                <div class="modal-param-item">
                    <div class="modal-param-name">Binding Affinity</div>
                    <div class="modal-param-value">${scenario.params.bindingAffinity} µM</div>
                </div>
                <div class="modal-param-item">
                    <div class="modal-param-name">Hill Coefficient</div>
                    <div class="modal-param-value">${scenario.params.hillCoefficient}</div>
                </div>
                <div class="modal-param-item">
                    <div class="modal-param-name">Methylation</div>
                    <div class="modal-param-value">${scenario.params.methylationFactor}</div>
                </div>
                <div class="modal-param-item">
                    <div class="modal-param-name">Mutation Severity</div>
                    <div class="modal-param-value">${scenario.params.mutationSeverity}</div>
                </div>
                <div class="modal-param-item">
                    <div class="modal-param-name">Translation Efficiency</div>
                    <div class="modal-param-value">${scenario.params.translationEfficiency}</div>
                </div>
            </div>
        </div>
        
        <div class="modal-section">
            <h3 class="modal-section-title">🎯 Key Features</h3>
            <ul style="color: var(--text-secondary); line-height: 2; padding-left: 20px;">
                ${featuresHTML}
            </ul>
        </div>
        
        <div class="modal-actions">
            <button class="btn-try-scenario" onclick="applyScenario('${scenarioKey}')">
                🚀 Try This Scenario
            </button>
            <button class="btn-cancel" onclick="closeScenarioModal()">
                Cancel
            </button>
        </div>
    `;
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

/**
 * Close scenario modal
 */
function closeScenarioModal() {
    const modal = document.getElementById('scenario-modal');
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

/**
 * Apply scenario - auto-fill all parameters, genes, and diseases
 */
function applyScenario(scenarioKey) {
    const scenario = DETAILED_SCENARIOS[scenarioKey];
    if (!scenario) return;
    
    // Close modal
    closeScenarioModal();
    
    // Show loading message
    const loadingMsg = document.createElement('div');
    loadingMsg.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
        color: white;
        padding: 30px 50px;
        border-radius: 15px;
        font-size: 18px;
        font-weight: 600;
        z-index: 10001;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    `;
    loadingMsg.textContent = `🔄 Loading ${scenario.name}...`;
    document.body.appendChild(loadingMsg);
    
    setTimeout(() => {
        // Save current for comparison
        state.previousParams = { ...state.params };
        
        // Apply parameters
        Object.assign(state.params, scenario.params);
        
        // Select genes
        state.selectedGenes = [];
        scenario.selectedGenes.forEach(symbol => {
            const gene = GENE_DATABASE.find(g => g.symbol === symbol);
            if (gene) state.selectedGenes.push(gene);
        });
        
        // Select diseases
        state.selectedDiseases = [];
        scenario.selectedDiseases.forEach(name => {
            const disease = DISEASE_DATABASE.find(d => d.name === name);
            if (disease) state.selectedDiseases.push(disease);
        });
        
        // Update UI
        syncParametersToUI();
        updateNormalizedWeights();
        renderGeneList();
        renderDiseaseList();
        resetSimulation();
        updateContributionChart();
        
        // Remove loading message
        document.body.removeChild(loadingMsg);
        
        // Success notification
        const successMsg = document.createElement('div');
        successMsg.style.cssText = `
            position: fixed;
            top: 100px;
            right: 30px;
            background: var(--success-color);
            color: white;
            padding: 20px 30px;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 600;
            z-index: 10001;
            box-shadow: 0 5px 20px rgba(0,0,0,0.2);
            animation: slideInRight 0.3s ease;
        `;
        successMsg.innerHTML = `✅ ${scenario.name} applied successfully!<br><small style="font-weight:400; opacity:0.9;">Scroll down to run the simulation</small>`;
        document.body.appendChild(successMsg);
        
        setTimeout(() => {
            document.body.removeChild(successMsg);
        }, 4000);
        
        // Scroll to controls
        document.querySelector('.control-sidebar').scrollIntoView({ behavior: 'smooth', block: 'start' });
        
    }, 500);
}


/**
 * Tutorial Steps
 */
const TUTORIAL_STEPS = [
    {
        title: 'Welcome to the Virtual Multi-Omics Lab! 🧬',
        text: `This simulator models how transcription factors regulate gene expression and how genomics, transcriptomics, and proteomics data integrate to predict disease risk.\n\nYou'll explore realistic biological models including the Hill equation for TF binding, stochastic gene expression, protein dynamics, and multi-omics integration.\n\nPerfect for learning systems biology, bioinformatics, and precision medicine concepts!\n\nClick "Next" to begin the guided tour.`
    },
    {
        title: 'Step 1: Choose Your Genes & Diseases 🎯',
        text: `Start by selecting genes and diseases from the left control panel.\n\n<strong>Gene Selection:</strong> Each gene has unique baseline expression, protein levels, and disease associations. Try selecting TP53, BRCA1, and EGFR for cancer analysis.\n\n<strong>Disease Selection:</strong> Choose one or more diseases to predict risk. Each disease has different gene association weights.\n\nTip: Use the search box to quickly find genes! Select at least 2-3 genes and 1-2 diseases to see interesting patterns.`
    },
    {
        title: 'Step 2: Adjust Transcription Factor Parameters 🔬',
        text: `The <strong>Transcription Factor Binding</strong> section controls gene activation using the Hill equation:\n\nE = Vmax × [TF]ⁿ / (Kdⁿ + [TF]ⁿ)\n\n<strong>TF Concentration:</strong> Higher values activate more genes (typical: 10-200 nM)\n\n<strong>Binding Affinity (Kd):</strong> Lower Kd means stronger TF-DNA binding (typical: 0.1-10 µM)\n\n<strong>Hill Coefficient (n):</strong> n>1 creates sigmoidal (cooperative) response curves\n\nExperiment with these parameters and watch gene expression change in real-time!`
    },
    {
        title: 'Step 3: Explore Epigenetic & Genetic Regulation 🧪',
        text: `<strong>Methylation/Silencing:</strong> DNA methylation reduces gene expression (0 = no silencing, 1 = complete silencing). Common in cancer and aging.\n\n<strong>Mutation Severity:</strong> Genetic mutations reduce gene function (0 = wild-type, 1 = complete loss-of-function). TP53 mutations are found in >50% of cancers.\n\n<strong>Translation Efficiency (η):</strong> Rate of protein synthesis from mRNA. Drugs can increase this (e.g., 1.5-2.0).\n\n<strong>Protein Degradation:</strong> Higher rates mean faster protein turnover.\n\nTry increasing methylation to 0.5 and mutation to 0.3 to simulate a diseased state!`
    },
    {
        title: 'Step 4: Run the Time-Series Simulation ▶️',
        text: `Click <strong>"Run Simulation"</strong> to watch gene expression, protein levels, and disease risk evolve over time!\n\nThe simulation uses differential equations:\ndP/dt = η × T - δ × P\n\nWhere protein abundance (P) increases with translation (η × T) and decreases with degradation (δ × P).\n\nWatch the flow diagram update in real-time showing:\nGenomics → Transcriptomics → Proteomics → Disease Risk\n\nThe simulation runs for 50 hours with stochastic noise added to mimic biological variability.`
    },
    {
        title: 'Step 5: Analyze Results & Disease Risk 📊',
        text: `<strong>Disease Risk Cards:</strong> Show predicted risk (0-100%) for each selected disease based on multi-omics integration.\n\n<strong>Time-Series Charts:</strong> Display mRNA and protein dynamics for all selected genes over time.\n\n<strong>Contribution Analysis:</strong> See which genes contribute most to disease risk (stacked bar chart).\n\n<strong>Parameter Impact:</strong> The "What Changed?" panel shows which parameter changes had the biggest effect on disease risk.\n\nRisk is calculated using: Risk = sigmoid(w₁×G + w₂×T + w₃×P + bias)\n\nAdjust the multi-omics weights to emphasize different data layers!`
    },
    {
        title: 'Step 6: Save, Export & Explore More! 💾',
        text: `<strong>Save Scenarios:</strong> Save your current parameters to revisit later (stored in browser localStorage).\n\n<strong>Export Data:</strong> Download simulation results as CSV for further analysis in Excel, R, or Python.\n\n<strong>Load Presets:</strong> Try predefined scenarios like "Healthy State", "High Disease Risk", or "Drug Treatment".\n\n<strong>Randomize:</strong> Generate random parameters for exploratory analysis.\n\n<strong>Import Custom Data:</strong> Upload your own gene baseline data (JSON/CSV format).\n\nReady to explore? Click "Skip Tutorial" to start experimenting! 🚀`
    }
];

// Chart color palette for multi-gene visualization
const CHART_COLORS = [
    '#3498db', '#e74c3c', '#2ecc71', '#f39c12', 
    '#9b59b6', '#1abc9c', '#e67e22', '#34495e',
    '#16a085', '#c0392b'
];

// =============================================================================
// 2. STATE MANAGEMENT
// =============================================================================

const state = {
    selectedGenes: [],
    selectedDiseases: [],
    
    params: {
        tfConcentration: 50,
        bindingAffinity: 1,
        hillCoefficient: 2,
        methylationFactor: 0,
        mutationSeverity: 0,
        translationEfficiency: 0.7,
        proteinDegradation: 0.1,
        expressionNoise: 0.1,
        weightGenomics: 0.3,
        weightTranscriptomics: 0.4,
        weightProteomics: 0.3
    },
    
    previousParams: null,
    
    simulation: {
        running: false,
        paused: false,
        currentTime: 0,
        intervalId: null,
        timeSeriesData: {
            time: [],
            genes: {}
        }
    },
    
    charts: {
        mrna: null,
        protein: null,
        contribution: null
    },
    
    tutorial: {
        active: false,
        currentStep: 0
    }
};

// =============================================================================
// 3. MATHEMATICAL MODELS & CALCULATIONS
// =============================================================================

/**
 * Calculate gene expression using Hill equation
 */
function calculateGeneExpression(TF, Kd, n, Vmax, methylation, mutation) {
    const Kd_nM = Kd * 1000;
    const numerator = Vmax * Math.pow(TF, n);
    const denominator = Math.pow(Kd_nM, n) + Math.pow(TF, n);
    const E_gene = (numerator / denominator) * (1 - methylation) * (1 - mutation);
    return Math.max(0, E_gene);
}

/**
 * Add stochastic noise to gene expression
 */
function addExpressionNoise(E_gene, noiseLevel) {
    const noise = gaussianRandom(0, noiseLevel);
    const T = E_gene * (1 + noise);
    return Math.max(0, T);
}

/**
 * Update protein abundance using differential equation
 * dP/dt = eta * T - degradation * P
 */
function updateProteinLevel(currentP, T, eta, degradation, dt) {
    const dP = (eta * T - degradation * currentP) * dt;
    const newP = currentP + dP;
    return Math.max(0, newP);
}

/**
 * Calculate disease risk using sigmoid function
 */
function calculateDiseaseRisk(geneValues, disease, w1, w2, w3) {
    // Normalize weights
    const totalWeight = w1 + w2 + w3;
    if (totalWeight === 0) return { risk: 0, contributions: { genomic: 0, transcriptomic: 0, proteomic: 0 } };
    
    const normW1 = w1 / totalWeight;
    const normW2 = w2 / totalWeight;
    const normW3 = w3 / totalWeight;
    
    // Calculate weighted contributions for each omics layer
    let genomicScore = 0;
    let transcriptomicScore = 0;
    let proteomicScore = 0;
    let totalGenes = 0;
    
    for (const gene of state.selectedGenes) {
        const weight = disease.geneWeights[gene.symbol] || 0;
        const values = geneValues[gene.symbol];
        
        if (values) {
            // Normalize values by baseline - IMPROVED SCALING
            const normG = (values.genomic / gene.baselineTPM) * 2;  // Scale up for more sensitivity
            const normT = (values.transcriptomic / gene.baselineTPM) * 2;
            const normP = (values.proteomic / gene.baselineProtein) * 2;
            
            // Apply gene-specific weights
            genomicScore += weight * normG;
            transcriptomicScore += weight * normT;
            proteomicScore += weight * normP;
            totalGenes++;
        }
    }
    
    // Average across genes if multiple selected
    if (totalGenes > 0) {
        genomicScore /= totalGenes;
        transcriptomicScore /= totalGenes;
        proteomicScore /= totalGenes;
    }
    
    // Combine with weights and apply sigmoid
    const combinedScore = normW1 * genomicScore + normW2 * transcriptomicScore + normW3 * proteomicScore + disease.bias;
    
    // Sigmoid with adjusted steepness for better range
    const risk = (1 / (1 + Math.exp(-1.5 * combinedScore))) * 100;  // Multiplier for steeper curve
    
    return {
        risk: Math.max(0, Math.min(100, risk)),
        contributions: {
            genomic: genomicScore,
            transcriptomic: transcriptomicScore,
            proteomic: proteomicScore
        }
    };
}


/**
 * Sigmoid function
 */
function sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
}

/**
 * Generate Gaussian random number using Box-Muller transform
 */
function gaussianRandom(mean = 0, stdev = 1) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z0 * stdev;
}

/**
 * Normalize weights to sum = 1
 */
function normalizeWeights(w1, w2, w3) {
    const total = w1 + w2 + w3;
    if (total === 0) return { w1: 0.33, w2: 0.33, w3: 0.34 };
    return {
        w1: w1 / total,
        w2: w2 / total,
        w3: w3 / total
    };
}

// =============================================================================
// 4. SIMULATION ENGINE
// =============================================================================

/**
 * Initialize simulation data structures
 */
function initializeSimulation() {
    state.simulation.currentTime = 0;
    state.simulation.timeSeriesData = {
        time: [],
        genes: {}
    };
    
    // Initialize arrays for each selected gene
    for (const gene of state.selectedGenes) {
        state.simulation.timeSeriesData.genes[gene.symbol] = {
            mrna: [],
            protein: [gene.baselineProtein]  // Start at baseline
        };
    }
}

/**
 * Run one step of the simulation
 */
function simulationStep() {
    const params = state.params;
    const dt = SIMULATION_CONFIG.timeStep;
    
    // Calculate current values for all genes
    const currentValues = {};
    
    for (const gene of state.selectedGenes) {
        // Get previous protein level or baseline
        const proteinData = state.simulation.timeSeriesData.genes[gene.symbol].protein;
        const currentProtein = proteinData.length > 0 ? proteinData[proteinData.length - 1] : gene.baselineProtein;
        
        // Calculate gene expression (genomics)
        const E_gene = calculateGeneExpression(
            params.tfConcentration,
            params.bindingAffinity,
            params.hillCoefficient,
            gene.Vmax,
            params.methylationFactor,
            params.mutationSeverity
        );
        
        // Add noise (transcriptomics)
        const T = addExpressionNoise(E_gene, params.expressionNoise);
        
        // Update protein level (proteomics)
        const P = updateProteinLevel(
            currentProtein,
            T,
            params.translationEfficiency,
            params.proteinDegradation,
            dt
        );
        
        // Store values
        currentValues[gene.symbol] = {
            genomic: E_gene,
            transcriptomic: T,
            proteomic: P
        };
        
        // Add to time series
        state.simulation.timeSeriesData.genes[gene.symbol].mrna.push(T);
        state.simulation.timeSeriesData.genes[gene.symbol].protein.push(P);
    }
    
    // Update time
    state.simulation.currentTime += dt;
    state.simulation.timeSeriesData.time.push(state.simulation.currentTime);
    
    // Update visualizations
    updateFlowDiagram(currentValues);
    updateCharts();
    updateDiseaseCards(currentValues);
    updateContributionChart();
    updateSimulationTimeDisplay();
    
    // Check if simulation should stop
    if (state.simulation.currentTime >= SIMULATION_CONFIG.maxTime) {
        stopSimulation();
        analyzeParameterImpact();
    }
}


/**
 * Detect which scenario is currently applied based on parameters and gene selections
 */
function detectAppliedScenario() {
    // Check if DETAILED_SCENARIOS exists
    if (typeof DETAILED_SCENARIOS === 'undefined') {
        return null;
    }
    
    for (const [key, scenario] of Object.entries(DETAILED_SCENARIOS)) {
        // Check if genes match (allow for some flexibility)
        const selectedSymbols = state.selectedGenes.map(g => g.symbol).sort();
        const scenarioSymbols = scenario.selectedGenes.sort();
        
        const genesMatch = selectedSymbols.length === scenarioSymbols.length &&
            selectedSymbols.every((symbol, index) => symbol === scenarioSymbols[index]);
        
        // Check if key parameters are close (within 10% tolerance)
        const tfMatch = Math.abs(state.params.tfConcentration - scenario.params.tfConcentration) < 50;
        const mutationMatch = Math.abs(state.params.mutationSeverity - scenario.params.mutationSeverity) < 0.15;
        const methylationMatch = Math.abs(state.params.methylationFactor - scenario.params.methylationFactor) < 0.15;
        
        const paramsMatch = tfMatch && mutationMatch && methylationMatch;
        
        // If both genes and key parameters match, return this scenario
        if (genesMatch && paramsMatch) {
            return scenario;
        }
    }
    
    return null;
}



/**
 * Export comprehensive HTML report with all simulation results
 */
async function exportHTMLReport() {
    // Validate that there's data to export
    if (state.selectedGenes.length === 0) {
        alert('Please select at least one gene before exporting the report.');
        return;
    }
    
    if (state.simulation.timeSeriesData.time.length === 0) {
        alert('Please run a simulation before exporting the report.');
        return;
    }
    
    // Show loading message
    const loadingMsg = document.createElement('div');
    loadingMsg.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(52, 152, 219, 0.95);
        color: white;
        padding: 30px 50px;
        border-radius: 15px;
        font-size: 18px;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    `;
    loadingMsg.textContent = '📊 Generating HTML Report... Please wait...';
    document.body.appendChild(loadingMsg);
    
    try {
        // Capture charts as images
        const chartImages = {};
        
        // Capture mRNA chart
        const mrnaCanvas = document.getElementById('mrna-chart');
        if (mrnaCanvas) {
            chartImages.mrna = mrnaCanvas.toDataURL('image/png');
        }
        
        // Capture protein chart
        const proteinCanvas = document.getElementById('protein-chart');
        if (proteinCanvas) {
            chartImages.protein = proteinCanvas.toDataURL('image/png');
        }
        
        // Capture contribution chart
        const contributionCanvas = document.getElementById('contribution-chart');
        if (contributionCanvas) {
            chartImages.contribution = contributionCanvas.toDataURL('image/png');
        }
        
        // Generate HTML content
        const htmlContent = generateHTMLReport(chartImages);
        
        // Create and download file
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `MultiOmics_Report_${new Date().toISOString().slice(0,10)}_${Date.now()}.html`;
        a.click();
        URL.revokeObjectURL(url);
        
        // Remove loading message
        document.body.removeChild(loadingMsg);
        
        // Success message
        alert('✅ HTML Report exported successfully! Check your Downloads folder.');
        
    } catch (error) {
        console.error('Error exporting HTML report:', error);
        document.body.removeChild(loadingMsg);
        alert('❌ Error exporting report: ' + error.message);
    }
}



/**
 * Generate complete HTML report content with enhanced styling
 */
function generateHTMLReport(chartImages) {
    const currentDate = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
    
    // Detect applied scenario
    const appliedScenario = detectAppliedScenario();
    
    // Calculate current disease risks
    const currentValues = {};
    for (const gene of state.selectedGenes) {
        const E_gene = calculateGeneExpression(
            state.params.tfConcentration,
            state.params.bindingAffinity,
            state.params.hillCoefficient,
            gene.Vmax,
            state.params.methylationFactor,
            state.params.mutationSeverity
        );
        const T = addExpressionNoise(E_gene, state.params.expressionNoise);
        const proteinData = state.simulation.timeSeriesData.genes[gene.symbol]?.protein;
        const P = proteinData && proteinData.length > 0 ? proteinData[proteinData.length - 1] : gene.baselineProtein;
        
        currentValues[gene.symbol] = {
            genomic: E_gene,
            transcriptomic: T,
            proteomic: P
        };
    }
    
    // Calculate disease risks
    const diseaseRisks = [];
    for (const disease of state.selectedDiseases) {
        const result = calculateDiseaseRisk(
            currentValues,
            disease,
            state.params.weightGenomics,
            state.params.weightTranscriptomics,
            state.params.weightProteomics
        );
        diseaseRisks.push({
            name: disease.name,
            risk: result.risk,
            riskClass: result.risk >= 70 ? 'high' : result.risk >= 40 ? 'moderate' : 'low',
            contributions: result.contributions
        });
    }
    
    // Generate genes summary table
    let genesSummaryHTML = '';
    state.selectedGenes.forEach((gene, index) => {
        const values = currentValues[gene.symbol];
        const rowClass = index % 2 === 0 ? 'even-row' : 'odd-row';
        genesSummaryHTML += `
            <tr class="${rowClass}">
                <td><strong style="color: #3498db;">${gene.symbol}</strong></td>
                <td>${gene.name}</td>
                <td><span class="value-badge">${values.genomic.toFixed(2)}</span></td>
                <td><span class="value-badge">${values.transcriptomic.toFixed(2)}</span></td>
                <td><span class="value-badge">${values.proteomic.toFixed(2)}</span></td>
            </tr>
        `;
    });
    
    // Generate disease risk table with detailed contributions
    let diseaseRiskHTML = '';
    diseaseRisks.forEach(disease => {
        const colorClass = disease.riskClass === 'high' ? '#e74c3c' : 
                          disease.riskClass === 'moderate' ? '#f39c12' : '#27ae60';
        const icon = disease.riskClass === 'high' ? '🔴' : 
                     disease.riskClass === 'moderate' ? '🟡' : '🟢';
        
        diseaseRiskHTML += `
            <tr class="disease-row">
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 1.5em;">${icon}</span>
                        <strong>${disease.name}</strong>
                    </div>
                </td>
                <td>
                    <div style="font-size: 2em; font-weight: bold; color: ${colorClass};">
                        ${disease.risk.toFixed(1)}%
                    </div>
                </td>
                <td>
                    <span class="risk-badge risk-${disease.riskClass}">
                        ${disease.riskClass.toUpperCase()} RISK
                    </span>
                </td>
                <td style="font-size: 0.9em; color: #7f8c8d;">
                    <div>G: ${Math.abs(disease.contributions.genomic).toFixed(2)}</div>
                    <div>T: ${Math.abs(disease.contributions.transcriptomic).toFixed(2)}</div>
                    <div>P: ${Math.abs(disease.contributions.proteomic).toFixed(2)}</div>
                </td>
            </tr>
        `;
    });
    
    // Generate normalized weights
    const normalized = normalizeWeights(
        state.params.weightGenomics,
        state.params.weightTranscriptomics,
        state.params.weightProteomics
    );
    
    // Generate scenario section if applicable
    const scenarioHTML = appliedScenario ? `
        <div class="section">
            <h2 class="section-title">
                <span class="section-icon">🎯</span>
                Applied Scenario
            </h2>
            
            <div class="scenario-showcase-box">
                <div class="scenario-header-box">
                    <div class="scenario-icon-large">${appliedScenario.icon}</div>
                    <div class="scenario-info-box">
                        <h3 style="margin: 0 0 10px 0; font-size: 2em; color: #2c3e50;">${appliedScenario.name}</h3>
                        <div class="scenario-risk-badge ${appliedScenario.riskClass}">
                            ${appliedScenario.riskLevel}
                        </div>
                    </div>
                </div>
                
                <div class="scenario-description-box">
                    <h4 style="color: #3498db; margin-bottom: 10px;">📋 Overview</h4>
                    <p style="line-height: 1.8; color: #555;">
                        ${appliedScenario.description}
                    </p>
                </div>
                
                <div class="scenario-clinical-box">
                    <h4 style="color: #9b59b6; margin-bottom: 10px;">🏥 Clinical Context</h4>
                    <p style="line-height: 1.8; color: #555;">
                        ${appliedScenario.clinicalContext}
                    </p>
                </div>
                
                <div class="scenario-genes-box">
                    <h4 style="color: #2ecc71; margin-bottom: 10px;">🧬 Selected Genes</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                        ${appliedScenario.selectedGenes.map(g => 
                            `<span class="gene-badge-report">${g}</span>`
                        ).join('')}
                    </div>
                </div>
            </div>
        </div>
    ` : '';
    
    // Generate complete HTML with enhanced styling
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Multi-Omics Analysis Report - ${new Date().toISOString().slice(0,10)}</title>
    <style>
        /* Global Styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Fira+Code:wght@400;500&display=swap');
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: #2c3e50;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px 20px;
            min-height: 100vh;
        }
        
        .report-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 24px;
            box-shadow: 0 25px 80px rgba(0,0,0,0.4);
            overflow: hidden;
            animation: fadeIn 0.6s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        /* Header Styles */
        .report-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 60px 50px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .report-header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: pulse 15s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1) rotate(0deg); }
            50% { transform: scale(1.1) rotate(180deg); }
        }
        
        .report-header-content {
            position: relative;
            z-index: 1;
        }
        
        .header-logo {
            font-size: 4em;
            margin-bottom: 20px;
            filter: drop-shadow(0 5px 15px rgba(0,0,0,0.3));
        }
        
        .report-header h1 {
            font-size: 2.8em;
            margin-bottom: 15px;
            font-weight: 800;
            text-shadow: 0 3px 10px rgba(0,0,0,0.3);
            letter-spacing: -0.5px;
        }
        
        .report-header .subtitle {
            font-size: 1.3em;
            opacity: 0.95;
            font-weight: 300;
            margin-bottom: 20px;
        }
        
        .report-header .meta-info {
            display: inline-block;
            background: rgba(255,255,255,0.2);
            backdrop-filter: blur(10px);
            padding: 12px 30px;
            border-radius: 25px;
            font-size: 0.95em;
            margin-top: 10px;
        }
        
        /* Body Styles */
        .report-body {
            padding: 50px;
        }
        
        .section {
            margin-bottom: 60px;
            animation: slideUp 0.5s ease;
        }
        
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .section-title {
            font-size: 2em;
            color: #2c3e50;
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 4px solid transparent;
            border-image: linear-gradient(90deg, #667eea, #764ba2) 1;
            display: flex;
            align-items: center;
            gap: 15px;
            font-weight: 700;
        }
        
        .section-icon {
            font-size: 1.3em;
            filter: drop-shadow(0 2px 5px rgba(0,0,0,0.1));
        }
        
        /* Info Cards Grid */
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 25px;
            margin-bottom: 40px;
        }
        
        .info-card {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            padding: 30px;
            border-radius: 20px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.08);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }
        
        .info-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 4px;
            background: linear-gradient(90deg, #667eea, #764ba2);
            transform: scaleX(0);
            transform-origin: left;
            transition: transform 0.3s ease;
        }
        
        .info-card:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 15px 40px rgba(0,0,0,0.15);
        }
        
        .info-card:hover::before {
            transform: scaleX(1);
        }
        
        .info-card-title {
            font-size: 0.85em;
            color: #7f8c8d;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            font-weight: 600;
        }
        
        .info-card-value {
            font-size: 2.5em;
            font-weight: 800;
            color: #2c3e50;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        /* Highlight Box */
        .highlight-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            border-radius: 20px;
            margin: 40px 0;
            box-shadow: 0 15px 50px rgba(102, 126, 234, 0.4);
            position: relative;
            overflow: hidden;
        }
        
        .highlight-box::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
        }
        
        .highlight-box h3 {
            margin-bottom: 20px;
            font-size: 1.8em;
            font-weight: 700;
            position: relative;
        }
        
        .highlight-box p {
            position: relative;
            font-size: 1.1em;
            line-height: 1.9;
            opacity: 0.95;
        }
        
        /* Tables */
        table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin: 30px 0;
            background: white;
            box-shadow: 0 5px 20px rgba(0,0,0,0.08);
            border-radius: 15px;
            overflow: hidden;
        }
        
        thead {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        th {
            padding: 20px 18px;
            text-align: left;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.85em;
            letter-spacing: 1px;
        }
        
        td {
            padding: 18px;
            border-bottom: 1px solid #f0f0f0;
            transition: background-color 0.2s ease;
        }
        
        tr.even-row {
            background-color: #fafafa;
        }
        
        tbody tr:hover {
            background-color: #f0f4ff;
        }
        
        tr:last-child td {
            border-bottom: none;
        }
        
        .value-badge {
            display: inline-block;
            padding: 6px 14px;
            background: linear-gradient(135deg, #667eea20, #764ba220);
            border-radius: 8px;
            font-family: 'Fira Code', monospace;
            font-weight: 500;
            color: #667eea;
            font-size: 0.95em;
        }
        
        .risk-badge {
            display: inline-block;
            padding: 8px 20px;
            border-radius: 25px;
            font-weight: 700;
            font-size: 0.85em;
            letter-spacing: 0.5px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.15);
        }
        
        .risk-low {
            background: linear-gradient(135deg, #27ae60, #2ecc71);
            color: white;
        }
        
        .risk-moderate {
            background: linear-gradient(135deg, #f39c12, #f1c40f);
            color: white;
        }
        
        .risk-high {
            background: linear-gradient(135deg, #e74c3c, #c0392b);
            color: white;
        }
        
        .disease-row td {
            padding: 25px 18px;
        }
        
        /* Charts */
        .chart-container {
            margin: 40px 0;
            text-align: center;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.08);
        }
        
        .chart-title {
            font-size: 1.5em;
            color: #2c3e50;
            margin-bottom: 25px;
            font-weight: 700;
        }
        
        .chart-container img {
            max-width: 100%;
            height: auto;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
            border: 4px solid white;
        }
        
        /* Parameters */
        .parameter-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 18px;
            margin: 30px 0;
        }
        
        .parameter-item {
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            padding: 18px 22px;
            border-radius: 12px;
            border-left: 5px solid #667eea;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        .parameter-item:hover {
            transform: translateX(5px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .parameter-name {
            font-weight: 500;
            color: #555;
            font-size: 0.95em;
        }
        
        .parameter-value {
            font-weight: 700;
            color: #2c3e50;
            font-family: 'Fira Code', monospace;
            font-size: 1.05em;
            background: white;
            padding: 5px 12px;
            border-radius: 6px;
        }
        
        .parameter-group-title {
            font-size: 1.4em;
            color: #667eea;
            margin: 40px 0 20px 0;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        /* Scenario Showcase */
        .scenario-showcase-box {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 40px;
            border-radius: 20px;
            margin: 30px 0;
            box-shadow: 0 8px 25px rgba(0,0,0,0.08);
        }
        
        .scenario-header-box {
            display: flex;
            align-items: center;
            gap: 25px;
            margin-bottom: 30px;
            padding-bottom: 30px;
            border-bottom: 2px solid #dee2e6;
        }
        
        .scenario-icon-large {
            font-size: 5em;
            filter: drop-shadow(0 5px 15px rgba(0,0,0,0.2));
        }
        
        .scenario-risk-badge {
            display: inline-block;
            padding: 10px 25px;
            border-radius: 25px;
            font-weight: 700;
            font-size: 1em;
            box-shadow: 0 3px 10px rgba(0,0,0,0.15);
        }
        
        .scenario-description-box,
        .scenario-clinical-box,
        .scenario-genes-box {
            background: white;
            padding: 25px;
            border-radius: 15px;
            margin-bottom: 20px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.05);
        }
        
        .gene-badge-report {
            display: inline-block;
            padding: 8px 16px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border-radius: 20px;
            font-weight: 600;
            font-size: 0.9em;
            box-shadow: 0 3px 10px rgba(102, 126, 234, 0.3);
        }
        
        /* Mathematical Models */
        .math-box {
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            padding: 30px;
            border-radius: 15px;
            border-left: 5px solid #9b59b6;
            margin: 20px 0;
        }
        
        .math-box h4 {
            color: #9b59b6;
            margin-bottom: 15px;
            font-size: 1.2em;
            font-weight: 700;
        }
        
        .formula {
            font-family: 'Fira Code', monospace;
            background: white;
            padding: 20px;
            border-radius: 10px;
            font-size: 0.95em;
            color: #2c3e50;
            box-shadow: inset 0 2px 8px rgba(0,0,0,0.05);
            line-height: 1.8;
        }
        
        /* Footer */
        .footer {
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            color: white;
            padding: 50px 40px;
            text-align: center;
        }
        
        .footer-logo {
            font-size: 3em;
            margin-bottom: 20px;
            filter: drop-shadow(0 3px 10px rgba(0,0,0,0.3));
        }
        
        .footer h3 {
            font-size: 1.8em;
            margin-bottom: 15px;
            font-weight: 700;
        }
        
        .footer p {
            margin: 12px 0;
            opacity: 0.9;
            font-size: 1.05em;
        }
        
        .footer-divider {
            width: 100px;
            height: 3px;
            background: linear-gradient(90deg, #667eea, #764ba2);
            margin: 25px auto;
            border-radius: 2px;
        }
        
        /* Print Styles */
        @media print {
            body {
                background: white;
                padding: 0;
            }
            
            .report-container {
                box-shadow: none;
                max-width: 100%;
                border-radius: 0;
            }
            
            .section {
                page-break-inside: avoid;
            }
            
            .chart-container {
                page-break-inside: avoid;
            }
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
            .report-body {
                padding: 30px 25px;
            }
            
            .report-header {
                padding: 40px 25px;
            }
            
            .report-header h1 {
                font-size: 2em;
            }
            
            .info-grid {
                grid-template-columns: 1fr;
            }
            
            .parameter-grid {
                grid-template-columns: 1fr;
            }
            
            .scenario-header-box {
                flex-direction: column;
                text-align: center;
            }
        }
    </style>
</head>
<body>
    <div class="report-container">
        
        <!-- Header -->
        <div class="report-header">
            <div class="report-header-content">
                <div class="header-logo">🧬</div>
                <h1>Multi-Omics Gene Regulation & Disease Prediction Report</h1>
                <p class="subtitle">Comprehensive Analysis of Gene Expression Dynamics and Disease Risk Assessment</p>
                <div class="meta-info">
                    📅 Generated on: ${currentDate}
                </div>
            </div>
        </div>
        
        <!-- Body -->
        <div class="report-body">
            
            <!-- Executive Summary -->
            <div class="section">
                <h2 class="section-title">
                    <span class="section-icon">📊</span>
                    Executive Summary
                </h2>
                
                <div class="info-grid">
                    <div class="info-card">
                        <div class="info-card-title">Genes Analyzed</div>
                        <div class="info-card-value">${state.selectedGenes.length}</div>
                    </div>
                    <div class="info-card">
                        <div class="info-card-title">Diseases Evaluated</div>
                        <div class="info-card-value">${state.selectedDiseases.length}</div>
                    </div>
                    <div class="info-card">
                        <div class="info-card-title">Simulation Time</div>
                        <div class="info-card-value">${state.simulation.currentTime.toFixed(1)} hrs</div>
                    </div>
                    <div class="info-card">
                        <div class="info-card-title">Data Points</div>
                        <div class="info-card-value">${state.simulation.timeSeriesData.time.length}</div>
                    </div>
                </div>
                
                <div class="highlight-box">
                    <h3>🎯 Key Finding</h3>
                    <p>
                        This comprehensive multi-omics analysis evaluated <strong>${state.selectedGenes.length} genes</strong> 
                        (${state.selectedGenes.map(g => g.symbol).join(', ')}) across <strong>${state.selectedDiseases.length} disease condition(s)</strong> 
                        using advanced integration of genomics, transcriptomics, and proteomics data. The simulation modeled transcription factor binding 
                        kinetics, epigenetic regulation mechanisms, and protein dynamics over <strong>${state.simulation.currentTime.toFixed(1)} hours</strong> 
                        to generate precise disease risk predictions based on realistic biological models.
                    </p>
                </div>
            </div>
            
            ${scenarioHTML}
            
            <!-- Disease Risk Assessment -->
            <div class="section">
                <h2 class="section-title">
                    <span class="section-icon">⚕️</span>
                    Disease Risk Assessment
                </h2>
                
                <table>
                    <thead>
                        <tr>
                            <th>Disease</th>
                            <th>Risk Score</th>
                            <th>Risk Level</th>
                            <th>Omics Contributions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${diseaseRiskHTML}
                    </tbody>
                </table>
            </div>
            
            <!-- Gene Expression Summary -->
            <div class="section">
                <h2 class="section-title">
                    <span class="section-icon">🧬</span>
                    Gene Expression Profile
                </h2>
                
                <table>
                    <thead>
                        <tr>
                            <th>Gene Symbol</th>
                            <th>Gene Name</th>
                            <th>Genomic (TPM)</th>
                            <th>Transcriptomic (TPM)</th>
                            <th>Proteomic (AU)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${genesSummaryHTML}
                    </tbody>
                </table>
            </div>
            
            <!-- Visualizations -->
            <div class="section">
                <h2 class="section-title">
                    <span class="section-icon">📈</span>
                    Time-Series Visualizations
                </h2>
                
                ${chartImages.mrna ? `
                <div class="chart-container">
                    <div class="chart-title">📊 mRNA Expression Dynamics Over Time</div>
                    <img src="${chartImages.mrna}" alt="mRNA Expression Time Series">
                    <p style="margin-top: 15px; color: #7f8c8d; font-size: 0.9em;">
                        Temporal dynamics of mRNA expression levels showing transcriptional activity across selected genes
                    </p>
                </div>
                ` : ''}
                
                ${chartImages.protein ? `
                <div class="chart-container">
                    <div class="chart-title">🔬 Protein Abundance Dynamics Over Time</div>
                    <img src="${chartImages.protein}" alt="Protein Abundance Time Series">
                    <p style="margin-top: 15px; color: #7f8c8d; font-size: 0.9em;">
                        Protein level changes reflecting translation efficiency and degradation kinetics
                    </p>
                </div>
                ` : ''}
                
                ${chartImages.contribution ? `
                <div class="chart-container">
                    <div class="chart-title">📊 Per-Gene Contribution to Disease Risk</div>
                    <img src="${chartImages.contribution}" alt="Gene Contribution Analysis">
                    <p style="margin-top: 15px; color: #7f8c8d; font-size: 0.9em;">
                        Quantitative assessment of individual gene contributions to overall disease risk score
                    </p>
                </div>
                ` : ''}
            </div>
            
            <!-- Simulation Parameters -->
            <div class="section">
                <h2 class="section-title">
                    <span class="section-icon">⚙️</span>
                    Simulation Parameters
                </h2>
                
                <h3 class="parameter-group-title">🧪 Transcription Factor Binding Kinetics</h3>
                <div class="parameter-grid">
                    <div class="parameter-item">
                        <span class="parameter-name">TF Concentration</span>
                        <span class="parameter-value">${state.params.tfConcentration} nM</span>
                    </div>
                    <div class="parameter-item">
                        <span class="parameter-name">Binding Affinity (Kd)</span>
                        <span class="parameter-value">${state.params.bindingAffinity} µM</span>
                    </div>
                    <div class="parameter-item">
                        <span class="parameter-name">Hill Coefficient (n)</span>
                        <span class="parameter-value">${state.params.hillCoefficient}</span>
                    </div>
                </div>
                
                <h3 class="parameter-group-title">🔬 Epigenetic & Genetic Regulation</h3>
                <div class="parameter-grid">
                    <div class="parameter-item">
                        <span class="parameter-name">DNA Methylation Factor</span>
                        <span class="parameter-value">${state.params.methylationFactor}</span>
                    </div>
                    <div class="parameter-item">
                        <span class="parameter-name">Mutation Severity</span>
                        <span class="parameter-value">${state.params.mutationSeverity}</span>
                    </div>
                </div>
                
                <h3 class="parameter-group-title">🧫 Translation & Protein Dynamics</h3>
                <div class="parameter-grid">
                    <div class="parameter-item">
                        <span class="parameter-name">Translation Efficiency (η)</span>
                        <span class="parameter-value">${state.params.translationEfficiency}</span>
                    </div>
                    <div class="parameter-item">
                        <span class="parameter-name">Protein Degradation Rate (δ)</span>
                        <span class="parameter-value">${state.params.proteinDegradation} t⁻¹</span>
                    </div>
                    <div class="parameter-item">
                        <span class="parameter-name">Expression Noise (σ)</span>
                        <span class="parameter-value">${state.params.expressionNoise}</span>
                    </div>
                </div>
                
                <h3 class="parameter-group-title">📊 Multi-Omics Integration Weights</h3>
                <div class="parameter-grid">
                    <div class="parameter-item">
                        <span class="parameter-name">Genomics Weight (w₁)</span>
                        <span class="parameter-value">${normalized.w1.toFixed(2)}</span>
                    </div>
                    <div class="parameter-item">
                        <span class="parameter-name">Transcriptomics Weight (w₂)</span>
                        <span class="parameter-value">${normalized.w2.toFixed(2)}</span>
                    </div>
                    <div class="parameter-item">
                        <span class="parameter-name">Proteomics Weight (w₃)</span>
                        <span class="parameter-value">${normalized.w3.toFixed(2)}</span>
                    </div>
                </div>
            </div>
            
            <!-- Mathematical Models -->
            <div class="section">
                <h2 class="section-title">
                    <span class="section-icon">📐</span>
                    Mathematical Models & Biological Principles
                </h2>
                
                <div class="math-box">
                    <h4>🧬 Gene Expression (Hill Equation)</h4>
                    <div class="formula">
                        E<sub>gene</sub> = V<sub>max</sub> × [TF]<sup>n</sup> / (K<sub>d</sub><sup>n</sup> + [TF]<sup>n</sup>) × (1 - methylation) × (1 - mutation)
                    </div>
                    <p style="margin-top: 12px; color: #555; line-height: 1.7;">
                        Models transcription factor binding with cooperative kinetics, incorporating epigenetic silencing and genetic mutations.
                    </p>
                </div>
                
                <div class="math-box">
                    <h4>📊 Transcriptomics (Stochastic Model)</h4>
                    <div class="formula">
                        T = E<sub>gene</sub> × (1 + ε), where ε ~ N(0, σ<sub>noise</sub>)
                    </div>
                    <p style="margin-top: 12px; color: #555; line-height: 1.7;">
                        Incorporates biological variability through Gaussian noise, reflecting stochastic gene expression.
                    </p>
                </div>
                
                <div class="math-box">
                    <h4>🔬 Protein Dynamics (Differential Equation)</h4>
                    <div class="formula">
                        dP/dt = η × T - δ × P
                    </div>
                    <p style="margin-top: 12px; color: #555; line-height: 1.7;">
                        Models protein synthesis (translation) and degradation using first-order kinetics, where η = translation efficiency and δ = degradation rate.
                    </p>
                </div>
                
                <div class="math-box">
                    <h4>⚕️ Disease Risk (Sigmoid Integration)</h4>
                    <div class="formula">
                        Risk<sub>D</sub> = sigmoid(w₁ × f<sub>G</sub> + w₂ × f<sub>T</sub> + w₃ × f<sub>P</sub> + b<sub>D</sub>)
                    </div>
                    <p style="margin-top: 12px; color: #555; line-height: 1.7;">
                        Integrates genomics (G), transcriptomics (T), and proteomics (P) using weighted linear combination with disease-specific gene associations, transformed by sigmoid function to generate risk probability (0-100%).
                    </p>
                </div>
            </div>
            
            <!-- Methodology -->
            <div class="section">
                <h2 class="section-title">
                    <span class="section-icon">🔬</span>
                    Methodology & Biological Context
                </h2>
                
                <div style="background: linear-gradient(135deg, #f8f9fa, #e9ecef); padding: 35px; border-radius: 20px; line-height: 1.9; color: #555;">
                    <h4 style="color: #667eea; margin-bottom: 15px; font-size: 1.3em;">🧪 Multi-Omics Integration Approach</h4>
                    <p style="margin-bottom: 20px;">
                        This analysis employed a comprehensive systems biology framework to model gene regulation and predict disease risk through integration of three fundamental biological layers:
                    </p>
                    
                    <div style="background: white; padding: 25px; border-radius: 15px; margin: 20px 0; border-left: 5px solid #667eea;">
                        <h4 style="color: #667eea; margin-bottom: 12px;">1. 🧬 Genomics Layer</h4>
                        <p>
                            Gene expression was modeled using the Hill equation, which accurately captures transcription factor-DNA binding kinetics with cooperativity. 
                            The model incorporates epigenetic modifications (DNA methylation, histone modifications) that silence gene expression and genetic mutations 
                            that impair gene function, both critical factors in disease development.
                        </p>
                    </div>
                    
                    <div style="background: white; padding: 25px; border-radius: 15px; margin: 20px 0; border-left: 5px solid #2ecc71;">
                        <h4 style="color: #2ecc71; margin-bottom: 12px;">2. 📊 Transcriptomics Layer</h4>
                        <p>
                            mRNA levels were calculated from genomic expression with added stochastic noise (Gaussian distribution) to simulate the inherent 
                            biological variability in gene expression and technical measurement uncertainty present in RNA-sequencing experiments.
                        </p>
                    </div>
                    
                    <div style="background: white; padding: 25px; border-radius: 15px; margin: 20px 0; border-left: 5px solid #9b59b6;">
                        <h4 style="color: #9b59b6; margin-bottom: 12px;">3. 🔬 Proteomics Layer</h4>
                        <p>
                            Protein abundance was determined using a differential equation model that balances protein synthesis (translation) and degradation. 
                            This dynamic model captures temporal protein dynamics over ${state.simulation.currentTime.toFixed(1)} hours, reflecting the steady-state 
                            balance between production and clearance that determines cellular protein levels.
                        </p>
                    </div>
                    
                    <p style="margin-top: 25px;">
                        <strong>Disease Risk Prediction:</strong> Risk scores were calculated by integrating normalized values from all three omics layers using 
                        disease-specific gene association weights derived from clinical and experimental literature. The weighted linear combination was transformed 
                        via a sigmoid function to generate interpretable risk probabilities (0-100%), where higher scores indicate increased disease susceptibility.
                    </p>
                </div>
            </div>
            
            <!-- Conclusions -->
            <div class="section">
                <h2 class="section-title">
                    <span class="section-icon">💡</span>
                    Conclusions & Clinical Implications
                </h2>
                
                <div class="highlight-box">
                    <h3>🎯 Summary</h3>
                    <p style="margin-bottom: 20px;">
                        This multi-omics analysis successfully integrated genomic, transcriptomic, and proteomic data to generate comprehensive disease risk predictions. 
                        The simulation captured complex regulatory dynamics including transcription factor binding kinetics, epigenetic modifications, genetic mutations, 
                        and protein homeostasis.
                    </p>
                    <p>
                        <strong>Clinical Significance:</strong> The predicted risk scores reflect the cumulative impact of molecular alterations across multiple biological 
                        layers, providing a systems-level understanding of disease susceptibility. This approach can inform personalized medicine strategies by identifying 
                        high-risk individuals who may benefit from preventive interventions or targeted therapies.
                    </p>
                </div>
            </div>
            
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <div class="footer-logo">🧬</div>
            <h3>Virtual Multi-Omics Laboratory</h3>
            <div class="footer-divider"></div>
            <p style="font-size: 1.15em;">
                Developed by <strong style="color: #667eea;">Shubham Mahindrakar</strong>
            </p>
            <p>Advanced Bioinformatics & Computational Biology Research Platform</p>
            <p style="font-size: 0.9em; margin-top: 20px; opacity: 0.8;">
                © ${new Date().getFullYear()} | For Educational and Research Purposes
            </p>
            <p style="font-size: 0.85em; margin-top: 10px; opacity: 0.7;">
                This report was automatically generated using realistic biological models and comprehensive multi-omics data integration
            </p>
        </div>
    </div>
</body>
</html>
    `;
}




/**
 * Start simulation
 */
function startSimulation() {
    if (state.selectedGenes.length === 0) {
        alert('Please select at least one gene before running the simulation.');
        return;
    }
    
    // Initialize if starting fresh
    if (state.simulation.currentTime === 0) {
        initializeSimulation();
    }
    
    state.simulation.running = true;
    state.simulation.paused = false;
    
    // Update UI
    document.getElementById('run-simulation-btn').classList.add('hidden');
    document.getElementById('pause-simulation-btn').classList.remove('hidden');
    
    // Start simulation loop
    state.simulation.intervalId = setInterval(simulationStep, SIMULATION_CONFIG.updateInterval);
}

/**
 * Pause simulation
 */
function pauseSimulation() {
    state.simulation.running = false;
    state.simulation.paused = true;
    
    if (state.simulation.intervalId) {
        clearInterval(state.simulation.intervalId);
        state.simulation.intervalId = null;
    }
    
    // Update UI
    document.getElementById('run-simulation-btn').classList.remove('hidden');
    document.getElementById('pause-simulation-btn').classList.add('hidden');
    document.getElementById('run-simulation-btn').innerHTML = '▶️ Resume';
}

/**
 * Stop simulation
 */
function stopSimulation() {
    state.simulation.running = false;
    state.simulation.paused = false;
    
    if (state.simulation.intervalId) {
        clearInterval(state.simulation.intervalId);
        state.simulation.intervalId = null;
    }
    
    // Update UI
    document.getElementById('run-simulation-btn').classList.remove('hidden');
    document.getElementById('pause-simulation-btn').classList.add('hidden');
    document.getElementById('run-simulation-btn').innerHTML = '▶️ Run Simulation';
}

/**
 * Reset simulation
 */
function resetSimulation() {
    stopSimulation();
    initializeSimulation();
    
    // Reset charts
    if (state.charts.mrna) {
        state.charts.mrna.data.labels = [];
        state.charts.mrna.data.datasets.forEach(dataset => {
            dataset.data = [];
        });
        state.charts.mrna.update();
    }
    
    if (state.charts.protein) {
        state.charts.protein.data.labels = [];
        state.charts.protein.data.datasets.forEach(dataset => {
            dataset.data = [];
        });
        state.charts.protein.update();
    }
    
    // Reset flow diagram
    updateFlowDiagram({});
    updateDiseaseCards({});
    
    document.getElementById('sim-time-display').textContent = '0.0';
}

// =============================================================================
// 5. UI RENDERING FUNCTIONS
// =============================================================================

/**
 * Render gene list
 */
function renderGeneList() {
    const geneList = document.getElementById('gene-list');
    const searchTerm = document.getElementById('gene-search').value.toLowerCase();
    
    geneList.innerHTML = '';
    
    const filteredGenes = GENE_DATABASE.filter(gene => 
        gene.symbol.toLowerCase().includes(searchTerm) ||
        gene.name.toLowerCase().includes(searchTerm) ||
        gene.description.toLowerCase().includes(searchTerm)
    );
    
    filteredGenes.forEach(gene => {
        const isSelected = state.selectedGenes.some(g => g.symbol === gene.symbol);
        
        const geneItem = document.createElement('div');
        geneItem.className = `gene-item ${isSelected ? 'selected' : ''}`;
        geneItem.innerHTML = `
            <div class="gene-checkbox"></div>
            <div class="gene-info">
                <div class="gene-name">${gene.symbol} - ${gene.name}</div>
                <div class="gene-description">${gene.description}</div>
                <div class="gene-baseline">Baseline: ${gene.baselineTPM.toFixed(1)} TPM | Protein: ${gene.baselineProtein.toFixed(1)} AU</div>
            </div>
        `;
        
        geneItem.addEventListener('click', () => toggleGeneSelection(gene));
        geneList.appendChild(geneItem);
    });
    
    updateSelectedGeneCount();
}

/**
 * Toggle gene selection
 */
function toggleGeneSelection(gene) {
    const index = state.selectedGenes.findIndex(g => g.symbol === gene.symbol);
    
    if (index >= 0) {
        state.selectedGenes.splice(index, 1);
    } else {
        state.selectedGenes.push(gene);
    }
    
    renderGeneList();
    resetSimulation();
    updateCharts();
    updateContributionChart();
}

/**
 * Update selected gene count
 */
function updateSelectedGeneCount() {
    document.getElementById('selected-gene-count').textContent = state.selectedGenes.length;
}

/**
 * Render disease list
 */
function renderDiseaseList() {
    const diseaseList = document.getElementById('disease-list');
    diseaseList.innerHTML = '';
    
    DISEASE_DATABASE.forEach(disease => {
        const isSelected = state.selectedDiseases.some(d => d.name === disease.name);
        
        const diseaseItem = document.createElement('div');
        diseaseItem.className = `disease-item ${isSelected ? 'selected' : ''}`;
        diseaseItem.innerHTML = `
            <div class="disease-checkbox"></div>
            <div class="disease-name">${disease.name}</div>
        `;
        
        diseaseItem.addEventListener('click', () => toggleDiseaseSelection(disease));
        diseaseList.appendChild(diseaseItem);
    });
    
    updateSelectedDiseaseCount();
}

/**
 * Toggle disease selection
 */
function toggleDiseaseSelection(disease) {
    const index = state.selectedDiseases.findIndex(d => d.name === disease.name);
    
    if (index >= 0) {
        state.selectedDiseases.splice(index, 1);
    } else {
        state.selectedDiseases.push(disease);
    }
    
    renderDiseaseList();
    updateDiseaseCards({});
    updateContributionChart();
}

/**
 * Update selected disease count
 */
function updateSelectedDiseaseCount() {
    document.getElementById('selected-disease-count').textContent = state.selectedDiseases.length;
}

/**
 * Update flow diagram
 */
function updateFlowDiagram(currentValues) {
    if (state.selectedGenes.length === 0) {
        document.querySelector('#flow-genomics .flow-value').textContent = '0.0';
        document.querySelector('#flow-transcriptomics .flow-value').textContent = '0.0';
        document.querySelector('#flow-proteomics .flow-value').textContent = '0.0';
        document.querySelector('#flow-disease .flow-value').textContent = '0%';
        return;
    }
    
    // Calculate averages across all selected genes
    let avgG = 0, avgT = 0, avgP = 0;
    
    for (const gene of state.selectedGenes) {
        const values = currentValues[gene.symbol];
        if (values) {
            avgG += values.genomic;
            avgT += values.transcriptomic;
            avgP += values.proteomic;
        }
    }
    
    avgG /= state.selectedGenes.length;
    avgT /= state.selectedGenes.length;
    avgP /= state.selectedGenes.length;
    
    document.querySelector('#flow-genomics .flow-value').textContent = avgG.toFixed(1);
    document.querySelector('#flow-transcriptomics .flow-value').textContent = avgT.toFixed(1);
    document.querySelector('#flow-proteomics .flow-value').textContent = avgP.toFixed(1);
    
    // Calculate average disease risk
    if (state.selectedDiseases.length > 0) {
        let avgRisk = 0;
        for (const disease of state.selectedDiseases) {
            const result = calculateDiseaseRisk(
                currentValues,
                disease,
                state.params.weightGenomics,
                state.params.weightTranscriptomics,
                state.params.weightProteomics
            );
            avgRisk += result.risk;
        }
        avgRisk /= state.selectedDiseases.length;
        document.querySelector('#flow-disease .flow-value').textContent = avgRisk.toFixed(1) + '%';
    } else {
        document.querySelector('#flow-disease .flow-value').textContent = '0%';
    }
}

/**
 * Update disease risk cards
 */
function updateDiseaseCards(currentValues) {
    const container = document.getElementById('disease-cards-container');
    
    if (state.selectedDiseases.length === 0 || state.selectedGenes.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Select genes and diseases to view risk predictions</p></div>';
        return;
    }
    
    container.innerHTML = '';
    
    for (const disease of state.selectedDiseases) {
        const result = calculateDiseaseRisk(
            currentValues,
            disease,
            state.params.weightGenomics,
            state.params.weightTranscriptomics,
            state.params.weightProteomics
        );
        
        let riskClass = 'risk-low';
        let riskLabel = 'Low Risk';
        
        if (result.risk >= 70) {
            riskClass = 'risk-high';
            riskLabel = 'High Risk';
        } else if (result.risk >= 40) {
            riskClass = 'risk-moderate';
            riskLabel = 'Moderate Risk';
        }
        
        const card = document.createElement('div');
        card.className = `disease-card ${riskClass}`;
        card.innerHTML = `
            <div class="disease-card-header">
                <div class="disease-card-title">${disease.name}</div>
            </div>
            <div class="disease-card-risk">${result.risk.toFixed(1)}%</div>
            <div class="disease-card-label">${riskLabel}</div>
            <div class="disease-card-progress">
                <div class="disease-card-progress-bar" style="width: ${result.risk}%"></div>
            </div>
        `;
        
        container.appendChild(card);
    }
}

/**
 * Update simulation time display
 */
function updateSimulationTimeDisplay() {
    document.getElementById('sim-time-display').textContent = state.simulation.currentTime.toFixed(1);
}

/**
 * Update normalized weights display
 */
function updateNormalizedWeights() {
    const normalized = normalizeWeights(
        state.params.weightGenomics,
        state.params.weightTranscriptomics,
        state.params.weightProteomics
    );
    
    document.getElementById('norm-w1').textContent = normalized.w1.toFixed(2);
    document.getElementById('norm-w2').textContent = normalized.w2.toFixed(2);
    document.getElementById('norm-w3').textContent = normalized.w3.toFixed(2);
}

// =============================================================================
// 6. CHART MANAGEMENT
// =============================================================================

/**
 * Initialize all charts
 */
function initializeCharts() {
    initializeMRNAChart();
    initializeProteinChart();
    initializeContributionChart();
}

/**
 * Initialize mRNA chart
 */
function initializeMRNAChart() {
    const ctx = document.getElementById('mrna-chart');
    
    if (!ctx) {
        console.error('Canvas element mrna-chart not found');
        return;
    }
    
    state.charts.mrna = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: { 
                            family: 'Poppins', 
                            size: 11 
                        },
                        usePointStyle: true,
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(44, 62, 80, 0.9)',
                    titleFont: { 
                        family: 'Poppins', 
                        size: 13 
                    },
                    bodyFont: { 
                        family: 'Poppins', 
                        size: 12 
                    },
                    padding: 12,
                    cornerRadius: 8
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time (hours)',
                        font: { 
                            family: 'Poppins', 
                            size: 13, 
                            weight: '600' 
                        }
                    },
                    grid: { 
                        color: 'rgba(0, 0, 0, 0.05)' 
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'mRNA Expression (TPM)',
                        font: { 
                            family: 'Poppins', 
                            size: 13, 
                            weight: '600' 
                        }
                    },
                    beginAtZero: true,
                    grid: { 
                        color: 'rgba(0, 0, 0, 0.05)' 
                    }
                }
            },
            animation: {
                duration: 0  // Disable for real-time updates
            }
        }
    });
}


/**
 * Initialize protein chart
 */
function initializeProteinChart() {
    const ctx = document.getElementById('protein-chart');
    
    if (!ctx) {
        console.error('Canvas element protein-chart not found');
        return;
    }
    
    state.charts.protein = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: { 
                            family: 'Poppins', 
                            size: 11 
                        },
                        usePointStyle: true,
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(44, 62, 80, 0.9)',
                    titleFont: { 
                        family: 'Poppins', 
                        size: 13 
                    },
                    bodyFont: { 
                        family: 'Poppins', 
                        size: 12 
                    },
                    padding: 12,
                    cornerRadius: 8
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time (hours)',
                        font: { 
                            family: 'Poppins', 
                            size: 13, 
                            weight: '600' 
                        }
                    },
                    grid: { 
                        color: 'rgba(0, 0, 0, 0.05)' 
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Protein Abundance (AU)',
                        font: { 
                            family: 'Poppins', 
                            size: 13, 
                            weight: '600' 
                        }
                    },
                    beginAtZero: true,
                    grid: { 
                        color: 'rgba(0, 0, 0, 0.05)' 
                    }
                }
            },
            animation: {
                duration: 0
            }
        }
    });
}


/**
 * Initialize contribution chart
 */
function initializeContributionChart() {
    const ctx = document.getElementById('contribution-chart');
    
    if (!ctx) {
        console.error('Canvas element contribution-chart not found');
        return;
    }
    
    state.charts.contribution = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: { 
                            family: 'Poppins', 
                            size: 11 
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(44, 62, 80, 0.9)',
                    titleFont: { 
                        family: 'Poppins', 
                        size: 13 
                    },
                    bodyFont: { 
                        family: 'Poppins', 
                        size: 12 
                    },
                    padding: 12,
                    cornerRadius: 8
                }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: { 
                        display: false 
                    },
                    ticks: {
                        font: { 
                            family: 'Poppins', 
                            size: 11 
                        }
                    }
                },
                y: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Contribution to Disease Risk',
                        font: { 
                            family: 'Poppins', 
                            size: 13, 
                            weight: '600' 
                        }
                    },
                    beginAtZero: true,
                    grid: { 
                        color: 'rgba(0, 0, 0, 0.05)' 
                    }
                }
            }
        }
    });
}



/**
 * Update time-series charts
 */
function updateCharts() {
    if (!state.charts.mrna || !state.charts.protein) return;
    
    // Update datasets for each selected gene
    const mrnaDatasets = [];
    const proteinDatasets = [];
    
    state.selectedGenes.forEach((gene, index) => {
        const color = CHART_COLORS[index % CHART_COLORS.length];
        const data = state.simulation.timeSeriesData.genes[gene.symbol];
        
        if (data) {
            mrnaDatasets.push({
                label: gene.symbol,
                data: data.mrna,
                borderColor: color,
                backgroundColor: color + '20',
                borderWidth: 2,
                fill: false,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 5
            });
            
            proteinDatasets.push({
                label: gene.symbol,
                data: data.protein,
                borderColor: color,
                backgroundColor: color + '20',
                borderWidth: 2,
                fill: false,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 5
            });
        }
    });
    
    // Update mRNA chart
    state.charts.mrna.data.labels = state.simulation.timeSeriesData.time;
    state.charts.mrna.data.datasets = mrnaDatasets;
    state.charts.mrna.update('none');
    
    // Update protein chart
    state.charts.protein.data.labels = state.simulation.timeSeriesData.time;
    state.charts.protein.data.datasets = proteinDatasets;
    state.charts.protein.update('none');
}


/**
 * Update contribution chart
 */
function updateContributionChart() {
    if (!state.charts.contribution) {
        console.warn('Contribution chart not initialized yet');
        return;
    }
    
    if (state.selectedGenes.length === 0 || state.selectedDiseases.length === 0) {
        state.charts.contribution.data.labels = [];
        state.charts.contribution.data.datasets = [];
        state.charts.contribution.update();
        return;
    }
    
    // Calculate current values for all selected genes
    const currentValues = {};
    
    for (const gene of state.selectedGenes) {
        // Calculate gene expression using current parameters
        const E_gene = calculateGeneExpression(
            state.params.tfConcentration,
            state.params.bindingAffinity,
            state.params.hillCoefficient,
            gene.Vmax,
            state.params.methylationFactor,
            state.params.mutationSeverity
        );
        
        // Add noise to get transcriptomics
        const T = addExpressionNoise(E_gene, state.params.expressionNoise);
        
        // Get current protein level from simulation or use baseline
        let P = gene.baselineProtein;
        if (state.simulation.timeSeriesData.genes[gene.symbol] && 
            state.simulation.timeSeriesData.genes[gene.symbol].protein.length > 0) {
            const proteinData = state.simulation.timeSeriesData.genes[gene.symbol].protein;
            P = proteinData[proteinData.length - 1];
        }
        
        currentValues[gene.symbol] = {
            genomic: E_gene,
            transcriptomic: T,
            proteomic: P
        };
    }
    
    // Prepare data for each disease
    const diseaseLabels = state.selectedDiseases.map(d => d.name);
    
    // Calculate contributions per gene for each disease
    const geneContributions = {};
    
    state.selectedGenes.forEach((gene, index) => {
        geneContributions[gene.symbol] = {
            data: [],
            backgroundColor: CHART_COLORS[index % CHART_COLORS.length] + 'CC',
            borderColor: CHART_COLORS[index % CHART_COLORS.length],
            borderWidth: 2,
            label: gene.symbol
        };
    });
    
    // Calculate contribution for each disease
    for (const disease of state.selectedDiseases) {
        for (const gene of state.selectedGenes) {
            const weight = disease.geneWeights[gene.symbol] || 0;
            const values = currentValues[gene.symbol];
            
            if (values) {
                // Normalize values by baseline
                const normG = values.genomic / gene.Vmax;
                const normT = values.transcriptomic / gene.Vmax;
                const normP = values.proteomic / gene.baselineProtein;
                
                // Get normalized weights
                const normalized = normalizeWeights(
                    state.params.weightGenomics,
                    state.params.weightTranscriptomics,
                    state.params.weightProteomics
                );
                
                // Calculate combined contribution
                const contribution = Math.abs(weight) * (
                    normalized.w1 * normG +
                    normalized.w2 * normT +
                    normalized.w3 * normP
                ) * 100;
                
                geneContributions[gene.symbol].data.push(contribution);
            } else {
                geneContributions[gene.symbol].data.push(0);
            }
        }
    }
    
    // Convert to datasets array
    const datasets = Object.values(geneContributions);
    
    // Update chart
    state.charts.contribution.data.labels = diseaseLabels;
    state.charts.contribution.data.datasets = datasets;
    state.charts.contribution.update();
    
    console.log('✓ Contribution chart updated with', datasets.length, 'genes and', diseaseLabels.length, 'diseases');
}





// =============================================================================
// 7. PARAMETER CHANGE DETECTION & IMPACT ANALYSIS
// =============================================================================


/**
 * Detect and track parameter changes
 */
function detectParameterChange(paramKey) {
    // Initialize previous params if not set
    if (!state.previousParams) {
        state.previousParams = { ...state.params };
        return;
    }
    
    // Calculate the change
    const oldValue = state.previousParams[paramKey];
    const newValue = state.params[paramKey];
    
    if (Math.abs(newValue - oldValue) > 0.001) {
        console.log(`Parameter changed: ${paramKey} from ${oldValue.toFixed(3)} to ${newValue.toFixed(3)}`);
        
        // Update previous params
        state.previousParams = { ...state.params };
        
        // Update impact analysis after a short delay (debounce)
        clearTimeout(window.paramChangeTimeout);
        window.paramChangeTimeout = setTimeout(() => {
            analyzeParameterImpact();
        }, 500);
    }
}



/**
 * Detect parameter changes and analyze impact
 */
function analyzeParameterImpact() {
    if (!state.previousParams) return;
    
    const changes = [];
    const paramNames = {
        tfConcentration: 'TF Concentration',
        bindingAffinity: 'Binding Affinity (Kd)',
        hillCoefficient: 'Hill Coefficient',
        methylationFactor: 'Methylation Factor',
        mutationSeverity: 'Mutation Severity',
        translationEfficiency: 'Translation Efficiency',
        proteinDegradation: 'Protein Degradation',
        expressionNoise: 'Expression Noise',
        weightGenomics: 'Genomics Weight',
        weightTranscriptomics: 'Transcriptomics Weight',
        weightProteomics: 'Proteomics Weight'
    };
    
    // Detect changes
    for (const key in state.params) {
        if (Math.abs(state.params[key] - state.previousParams[key]) > 0.001) {
            const delta = state.params[key] - state.previousParams[key];
            const percentChange = Math.abs(delta / state.previousParams[key]) * 100;
            
            changes.push({
                param: paramNames[key],
                delta: delta,
                percentChange: percentChange,
                impact: percentChange > 50 ? 'high' : percentChange > 20 ? 'medium' : 'low'
            });
        }
    }
    
    // Sort by impact
    changes.sort((a, b) => b.percentChange - a.percentChange);
    
    // Display results
    displayParameterImpact(changes);
}


/**
 * Display parameter impact analysis
 */
function displayParameterImpact(changes) {
    const container = document.getElementById('what-changed-content');
    
    if (!container) {
        console.error('what-changed-content element not found');
        return;
    }
    
    if (changes.length === 0) {
        container.innerHTML = '<p class="empty-state">Adjust parameters to see impact analysis. Changes will appear here after you modify sliders.</p>';
        return;
    }
    
    container.innerHTML = '<p style="margin-bottom: 15px; color: #7f8c8d; font-size: 0.9rem;"><strong>Recent parameter changes ranked by impact:</strong></p>';
    
    const topChanges = changes.slice(0, 5);  // Show top 5
    
    topChanges.forEach(change => {
        const icon = change.impact === 'high' ? '🔴' : change.impact === 'medium' ? '🟡' : '🟢';
        const impactText = change.impact === 'high' ? 'High Impact' : 
                          change.impact === 'medium' ? 'Medium Impact' : 'Low Impact';
        
        const changeItem = document.createElement('div');
        changeItem.className = 'change-item';
        changeItem.innerHTML = `
            <div class="change-icon">${icon}</div>
            <div class="change-details">
                <div class="change-parameter">${change.param}</div>
                <div class="change-delta">Changed by ${change.delta > 0 ? '+' : ''}${change.delta.toFixed(3)} (${change.percentChange.toFixed(1)}% change)</div>
            </div>
            <div class="change-impact ${change.impact}">${impactText}</div>
        `;
        
        container.appendChild(changeItem);
    });
}



// =============================================================================
// 8. PRESET & SCENARIO MANAGEMENT
// =============================================================================

/**
 * Load preset scenario
 */
function loadPreset(presetName) {
    const preset = PRESET_SCENARIOS[presetName];
    if (!preset) return;
    
    // Save current state for comparison
    state.previousParams = { ...state.params };
    
    // Load preset parameters
    Object.assign(state.params, preset.params);
    
    // Update UI
    syncParametersToUI();
    updateNormalizedWeights();
    
    // Reset simulation
    resetSimulation();

    // Update contribution chart
    updateContributionChart();
    
    // Analyze impact
    setTimeout(() => analyzeParameterImpact(), 100);
}

/**
 * Randomize parameters
 */
function randomizeParameters() {
    state.previousParams = { ...state.params };
    
    state.params.tfConcentration = Math.random() * 500 + 10;
    state.params.bindingAffinity = Math.random() * 10 + 0.1;
    state.params.hillCoefficient = Math.floor(Math.random() * 3) + 1;
    state.params.methylationFactor = Math.random() * 0.8;
    state.params.mutationSeverity = Math.random() * 0.8;
    state.params.translationEfficiency = Math.random() * 2 + 0.2;
    state.params.proteinDegradation = Math.random() * 0.5 + 0.05;
    state.params.expressionNoise = Math.random() * 0.3 + 0.05;
    
    // Keep weights reasonable
    const w1 = Math.random();
    const w2 = Math.random();
    const w3 = Math.random();
    const total = w1 + w2 + w3;
    state.params.weightGenomics = w1 / total;
    state.params.weightTranscriptomics = w2 / total;
    state.params.weightProteomics = w3 / total;
    
    syncParametersToUI();
    updateNormalizedWeights();
    resetSimulation();
    
    setTimeout(() => analyzeParameterImpact(), 100);
}

/**
 * Reset all parameters to defaults
 */
function resetAllParameters() {
    state.previousParams = { ...state.params };
    
    state.params = {
        tfConcentration: 50,
        bindingAffinity: 1,
        hillCoefficient: 2,
        methylationFactor: 0,
        mutationSeverity: 0,
        translationEfficiency: 0.7,
        proteinDegradation: 0.1,
        expressionNoise: 0.1,
        weightGenomics: 0.3,
        weightTranscriptomics: 0.4,
        weightProteomics: 0.3
    };
    
    syncParametersToUI();
    updateNormalizedWeights();
    resetSimulation();
}

/**
 * Sync parameters to UI inputs
 */
function syncParametersToUI() {
    for (const key in state.params) {
        const slider = document.getElementById(key.replace(/([A-Z])/g, '-$1').toLowerCase());
        const numberInput = document.getElementById(key.replace(/([A-Z])/g, '-$1').toLowerCase() + '-num');
        
        if (slider && numberInput) {
            slider.value = state.params[key];
            numberInput.value = state.params[key];
        }
    }
}

// =============================================================================
// 9. DATA IMPORT/EXPORT
// =============================================================================

/**
 * Export simulation data as CSV
 */
function exportData() {
    if (state.simulation.timeSeriesData.time.length === 0) {
        alert('No simulation data to export. Please run a simulation first.');
        return;
    }
    
    let csv = 'Time';
    
    // Headers
    for (const gene of state.selectedGenes) {
        csv += `,${gene.symbol}_mRNA,${gene.symbol}_Protein`;
    }
    csv += '\n';
    
    // Data rows
    for (let i = 0; i < state.simulation.timeSeriesData.time.length; i++) {
        csv += state.simulation.timeSeriesData.time[i].toFixed(2);
        
        for (const gene of state.selectedGenes) {
            const data = state.simulation.timeSeriesData.genes[gene.symbol];
            const mrna = data.mrna[i] || 0;
            const protein = data.protein[i] || 0;
            csv += `,${mrna.toFixed(4)},${protein.toFixed(4)}`;
        }
        csv += '\n';
    }
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `multiomics_simulation_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Save current scenario to localStorage
 */
function saveScenario() {
    const scenarioName = prompt('Enter a name for this scenario:');
    if (!scenarioName) return;
    
    const scenario = {
        name: scenarioName,
        params: { ...state.params },
        selectedGenes: state.selectedGenes.map(g => g.symbol),
        selectedDiseases: state.selectedDiseases.map(d => d.name),
        timestamp: Date.now()
    };
    
    // Get existing scenarios
    const scenarios = JSON.parse(localStorage.getItem('multiomics_scenarios') || '[]');
    scenarios.push(scenario);
    localStorage.setItem('multiomics_scenarios', JSON.stringify(scenarios));
    
    alert(`Scenario "${scenarioName}" saved successfully!`);
}

/**
 * Import custom gene data
 */
function importCustomData(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            let data;
            
            if (file.name.endsWith('.json')) {
                data = JSON.parse(e.target.result);
            } else if (file.name.endsWith('.csv')) {
                // Simple CSV parser
                const lines = e.target.result.split('\n');
                data = [];
                const headers = lines[0].split(',');
                
                for (let i = 1; i < lines.length; i++) {
                    if (lines[i].trim()) {
                        const values = lines[i].split(',');
                        const obj = {};
                        headers.forEach((header, index) => {
                            obj[header.trim()] = values[index]?.trim();
                        });
                        data.push(obj);
                    }
                }
            }
            
            // Validate and merge with existing gene database
            if (Array.isArray(data)) {
                alert(`Successfully imported ${data.length} gene records. (Note: Custom import is for demonstration - in production, implement full validation and merging logic.)`);
            }
        } catch (error) {
            alert('Error parsing file: ' + error.message);
        }
    };
    
    reader.readAsText(file);
}

// =============================================================================
// 10. TUTORIAL SYSTEM
// =============================================================================

/**
 * Start tutorial
 */
function startTutorial() {
    state.tutorial.active = true;
    state.tutorial.currentStep = 0;
    showTutorialStep();
    document.getElementById('tutorial-overlay').classList.remove('hidden');
}

/**
 * Show current tutorial step
 */
function showTutorialStep() {
    const step = TUTORIAL_STEPS[state.tutorial.currentStep];
    
    document.getElementById('tutorial-title').textContent = step.title;
    document.getElementById('tutorial-text').innerHTML = step.text;
    document.getElementById('tutorial-step-current').textContent = state.tutorial.currentStep + 1;
    document.getElementById('tutorial-step-total').textContent = TUTORIAL_STEPS.length;
    
    // Update progress bar
    const progress = ((state.tutorial.currentStep + 1) / TUTORIAL_STEPS.length) * 100;
    document.getElementById('tutorial-progress-bar').style.width = progress + '%';
    
    // Update button states
    document.getElementById('tutorial-prev').disabled = state.tutorial.currentStep === 0;
    
    if (state.tutorial.currentStep === TUTORIAL_STEPS.length - 1) {
        document.getElementById('tutorial-next').textContent = 'Finish';
    } else {
        document.getElementById('tutorial-next').textContent = 'Next';
    }
}

/**
 * Next tutorial step
 */
function nextTutorialStep() {
    if (state.tutorial.currentStep < TUTORIAL_STEPS.length - 1) {
        state.tutorial.currentStep++;
        showTutorialStep();
    } else {
        closeTutorial();
    }
}

/**
 * Previous tutorial step
 */
function prevTutorialStep() {
    if (state.tutorial.currentStep > 0) {
        state.tutorial.currentStep--;
        showTutorialStep();
    }
}

/**
 * Skip tutorial
 */
function skipTutorial() {
    if (confirm('Are you sure you want to skip the tutorial?')) {
        closeTutorial();
    }
}

/**
 * Close tutorial
 */
function closeTutorial() {
    state.tutorial.active = false;
    document.getElementById('tutorial-overlay').classList.add('hidden');
}

// =============================================================================
// 11. EVENT LISTENERS & INITIALIZATION
// =============================================================================

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Gene search
    document.getElementById('gene-search').addEventListener('input', renderGeneList);
    
    // Gene panel actions
    document.getElementById('select-all-genes').addEventListener('click', () => {
        state.selectedGenes = [...GENE_DATABASE];
        renderGeneList();
        resetSimulation();
        updateCharts();
    });
    
    document.getElementById('clear-genes').addEventListener('click', () => {
        state.selectedGenes = [];
        renderGeneList();
        resetSimulation();
        updateCharts();
    });
    
    document.getElementById('save-panel').addEventListener('click', saveScenario);
    
    // Preset selector
    document.getElementById('preset-selector').addEventListener('change', (e) => {
        if (e.target.value) {
            loadPreset(e.target.value);
        }
    });
    
    document.getElementById('load-preset-btn').addEventListener('click', () => {
        const preset = document.getElementById('preset-selector').value;
        if (preset) {
            loadPreset(preset);
        } else {
            alert('Please select a preset first.');
        }
    });
    
    document.getElementById('randomize-btn').addEventListener('click', randomizeParameters);
    
    // Parameter sliders - sync with number inputs
    const paramKeys = [
        'tfConcentration', 'bindingAffinity', 'hillCoefficient', 'methylationFactor',
        'mutationSeverity', 'translationEfficiency', 'proteinDegradation', 'expressionNoise',
        'weightGenomics', 'weightTranscriptomics', 'weightProteomics'
    ];
    
    // Export HTML report
    document.getElementById('export-html-btn')?.addEventListener('click', exportHTMLReport);


    paramKeys.forEach(key => {
        const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        const slider = document.getElementById(kebabKey);
        const numberInput = document.getElementById(kebabKey + '-num');
        
        if (slider && numberInput) {
            slider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                state.params[key] = value;
                numberInput.value = value;
                
                if (key.startsWith('weight')) {
                    updateNormalizedWeights();
                }
                
                updateContributionChart();
            });
            
            numberInput.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value)) {
                    state.params[key] = value;
                    slider.value = value;
                    
                    if (key.startsWith('weight')) {
                        updateNormalizedWeights();
                    }
                    
                    updateContributionChart();
                }
            });

            numberInput.addEventListener('change', (e) => {
                detectParameterChange(key);
                });
        }
    });
    
    // Simulation controls
    document.getElementById('run-simulation-btn').addEventListener('click', startSimulation);
    document.getElementById('pause-simulation-btn').addEventListener('click', pauseSimulation);
    document.getElementById('reset-simulation-btn').addEventListener('click', resetSimulation);
    
    // Data management
    document.getElementById('export-data-btn').addEventListener('click', exportData);
    document.getElementById('save-scenario-btn').addEventListener('click', saveScenario);
    document.getElementById('import-data').addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            importCustomData(e.target.files[0]);
        }
    });
    
    // Header actions
    document.getElementById('start-tutorial-btn').addEventListener('click', startTutorial);
    document.getElementById('reset-all-btn').addEventListener('click', resetAllParameters);
    
    // Tutorial controls
    document.getElementById('tutorial-close').addEventListener('click', closeTutorial);
    document.getElementById('tutorial-next').addEventListener('click', nextTutorialStep);
    document.getElementById('tutorial-prev').addEventListener('click', prevTutorialStep);
    document.getElementById('tutorial-skip').addEventListener('click', skipTutorial);
    
    // Collapsible sections
    document.getElementById('math-model-header').addEventListener('click', () => {
        document.getElementById('math-model-section').classList.toggle('collapsed');
    });
}



/**
 * Initialize application
 */
function init() {
    console.log('Initializing Virtual Multi-Omics Laboratory...');

    // Initialize previous params for change tracking
    state.previousParams = { ...state.params };

    // Render UI
    renderGeneList();
    renderDiseaseList();
    
    // Initialize charts
    initializeCharts();
    
    // Setup event listeners
    setupEventListeners();
    
    // Update displays
    updateNormalizedWeights();
    updateSelectedGeneCount();
    updateSelectedDiseaseCount();
    
    // Auto-start tutorial on first visit
    const hasVisited = localStorage.getItem('multiomics_visited');
    if (!hasVisited) {
        localStorage.setItem('multiomics_visited', 'true');
        setTimeout(startTutorial, 1000);
    }
    
    console.log('Virtual Multi-Omics Laboratory initialized successfully!');
    console.log('Total genes available:', GENE_DATABASE.length);
    console.log('Total diseases available:', DISEASE_DATABASE.length);
}

// =============================================================================
// 12. START APPLICATION
// =============================================================================

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// =============================================================================
// END OF SCRIPT
// =============================================================================





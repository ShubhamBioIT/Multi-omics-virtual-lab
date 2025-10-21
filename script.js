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
 * Generate complete HTML report content
 */
function generateHTMLReport(chartImages) {
    const currentDate = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
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
            riskClass: result.risk >= 70 ? 'high' : result.risk >= 40 ? 'moderate' : 'low'
        });
    }
    
    // Generate genes summary table
    let genesSummaryHTML = '';
    state.selectedGenes.forEach(gene => {
        const values = currentValues[gene.symbol];
        genesSummaryHTML += `
            <tr>
                <td><strong>${gene.symbol}</strong></td>
                <td>${gene.name}</td>
                <td>${values.genomic.toFixed(2)}</td>
                <td>${values.transcriptomic.toFixed(2)}</td>
                <td>${values.proteomic.toFixed(2)}</td>
            </tr>
        `;
    });
    
    // Generate disease risk table
    let diseaseRiskHTML = '';
    diseaseRisks.forEach(disease => {
        const colorClass = disease.riskClass === 'high' ? '#e74c3c' : 
                          disease.riskClass === 'moderate' ? '#f39c12' : '#27ae60';
        diseaseRiskHTML += `
            <tr>
                <td><strong>${disease.name}</strong></td>
                <td style="color: ${colorClass}; font-weight: bold; font-size: 1.2em;">${disease.risk.toFixed(1)}%</td>
                <td>
                    <span style="
                        padding: 5px 15px;
                        border-radius: 20px;
                        background-color: ${colorClass}20;
                        color: ${colorClass};
                        font-weight: 600;
                        text-transform: uppercase;
                        font-size: 0.85em;
                    ">
                        ${disease.riskClass} Risk
                    </span>
                </td>
            </tr>
        `;
    });
    
    // Generate parameters table
    const normalized = normalizeWeights(
        state.params.weightGenomics,
        state.params.weightTranscriptomics,
        state.params.weightProteomics
    );
    
    // Generate complete HTML
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Multi-Omics Gene Regulation & Disease Prediction Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #2c3e50;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
        }
        
        .report-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        
        .report-header {
            background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
            color: white;
            padding: 50px 40px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .report-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
            opacity: 0.3;
        }
        
        .report-header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            position: relative;
            z-index: 1;
        }
        
        .report-header .subtitle {
            font-size: 1.2em;
            opacity: 0.95;
            position: relative;
            z-index: 1;
        }
        
        .report-header .date {
            margin-top: 20px;
            font-size: 0.95em;
            opacity: 0.9;
            position: relative;
            z-index: 1;
        }
        
        .report-body {
            padding: 40px;
        }
        
        .section {
            margin-bottom: 50px;
        }
        
        .section-title {
            font-size: 1.8em;
            color: #3498db;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid #3498db;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .section-icon {
            font-size: 1.2em;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .info-card {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }
        
        .info-card:hover {
            transform: translateY(-5px);
        }
        
        .info-card-title {
            font-size: 0.9em;
            color: #7f8c8d;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .info-card-value {
            font-size: 2em;
            font-weight: bold;
            color: #2c3e50;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border-radius: 10px;
            overflow: hidden;
        }
        
        thead {
            background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
            color: white;
        }
        
        th {
            padding: 15px;
            text-align: left;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.9em;
            letter-spacing: 0.5px;
        }
        
        td {
            padding: 15px;
            border-bottom: 1px solid #ecf0f1;
        }
        
        tr:last-child td {
            border-bottom: none;
        }
        
        tbody tr:hover {
            background-color: #f8f9fa;
        }
        
        .chart-container {
            margin: 30px 0;
            text-align: center;
            background: #f8f9fa;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        
        .chart-container img {
            max-width: 100%;
            height: auto;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .chart-title {
            font-size: 1.3em;
            color: #2c3e50;
            margin-bottom: 20px;
            font-weight: 600;
        }
        
        .parameter-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        
        .parameter-item {
            background: #f8f9fa;
            padding: 15px 20px;
            border-radius: 10px;
            border-left: 4px solid #3498db;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .parameter-name {
            font-weight: 500;
            color: #7f8c8d;
        }
        
        .parameter-value {
            font-weight: bold;
            color: #2c3e50;
            font-family: 'Courier New', monospace;
        }
        
        .highlight-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 15px;
            margin: 30px 0;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        
        .highlight-box h3 {
            margin-bottom: 15px;
            font-size: 1.5em;
        }
        
        .footer {
            background: #34495e;
            color: white;
            padding: 30px 40px;
            text-align: center;
        }
        
        .footer-content {
            max-width: 800px;
            margin: 0 auto;
        }
        
        .footer p {
            margin: 10px 0;
            opacity: 0.9;
        }
        
        .badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
            margin: 5px;
        }
        
        .badge-primary {
            background: #3498db;
            color: white;
        }
        
        .badge-success {
            background: #27ae60;
            color: white;
        }
        
        .badge-warning {
            background: #f39c12;
            color: white;
        }
        
        .badge-danger {
            background: #e74c3c;
            color: white;
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            
            .report-container {
                box-shadow: none;
                max-width: 100%;
            }
            
            .section {
                page-break-inside: avoid;
            }
        }
        
        @media (max-width: 768px) {
            .report-header h1 {
                font-size: 1.8em;
            }
            
            .report-body {
                padding: 20px;
            }
            
            .info-grid {
                grid-template-columns: 1fr;
            }
            
            .parameter-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="report-container">
        <!-- Header -->
        <div class="report-header">
            <h1>🧬 Multi-Omics Gene Regulation & Disease Prediction Report</h1>
            <p class="subtitle">Comprehensive Analysis of Gene Expression and Disease Risk</p>
            <p class="date">📅 Generated on: ${currentDate}</p>
        </div>
        
        <!-- Body -->
        <div class="report-body">
            
            <!-- Summary Section -->
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
                    <p style="font-size: 1.1em; line-height: 1.8;">
                        This analysis evaluated ${state.selectedGenes.length} genes (${state.selectedGenes.map(g => g.symbol).join(', ')}) 
                        across ${state.selectedDiseases.length} disease condition(s) using multi-omics integration. 
                        The simulation modeled transcription factor binding, epigenetic regulation, and protein dynamics 
                        over ${state.simulation.currentTime.toFixed(1)} hours to predict disease risk.
                    </p>
                </div>
            </div>
            
            <!-- Disease Risk Section -->
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
                        </tr>
                    </thead>
                    <tbody>
                        ${diseaseRiskHTML}
                    </tbody>
                </table>
            </div>
            
            <!-- Genes Summary Section -->
            <div class="section">
                <h2 class="section-title">
                    <span class="section-icon">🧬</span>
                    Gene Expression Summary
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
            
            <!-- Charts Section -->
            <div class="section">
                <h2 class="section-title">
                    <span class="section-icon">📈</span>
                    Time-Series Visualizations
                </h2>
                
                ${chartImages.mrna ? `
                <div class="chart-container">
                    <div class="chart-title">mRNA Expression Levels Over Time</div>
                    <img src="${chartImages.mrna}" alt="mRNA Expression Chart">
                </div>
                ` : ''}
                
                ${chartImages.protein ? `
                <div class="chart-container">
                    <div class="chart-title">Protein Abundance Over Time</div>
                    <img src="${chartImages.protein}" alt="Protein Abundance Chart">
                </div>
                ` : ''}
                
                ${chartImages.contribution ? `
                <div class="chart-container">
                    <div class="chart-title">Per-Gene Contribution to Disease Risk</div>
                    <img src="${chartImages.contribution}" alt="Contribution Chart">
                </div>
                ` : ''}
            </div>
            
            <!-- Simulation Parameters Section -->
            <div class="section">
                <h2 class="section-title">
                    <span class="section-icon">⚙️</span>
                    Simulation Parameters
                </h2>
                
                <h3 style="margin: 30px 0 15px 0; color: #3498db;">Transcription Factor Binding</h3>
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
                
                <h3 style="margin: 30px 0 15px 0; color: #3498db;">Epigenetic & Genetic Regulation</h3>
                <div class="parameter-grid">
                    <div class="parameter-item">
                        <span class="parameter-name">Methylation Factor</span>
                        <span class="parameter-value">${state.params.methylationFactor}</span>
                    </div>
                    <div class="parameter-item">
                        <span class="parameter-name">Mutation Severity</span>
                        <span class="parameter-value">${state.params.mutationSeverity}</span>
                    </div>
                </div>
                
                <h3 style="margin: 30px 0 15px 0; color: #3498db;">Translation & Protein Dynamics</h3>
                <div class="parameter-grid">
                    <div class="parameter-item">
                        <span class="parameter-name">Translation Efficiency (η)</span>
                        <span class="parameter-value">${state.params.translationEfficiency}</span>
                    </div>
                    <div class="parameter-item">
                        <span class="parameter-name">Protein Degradation Rate</span>
                        <span class="parameter-value">${state.params.proteinDegradation} t⁻¹</span>
                    </div>
                    <div class="parameter-item">
                        <span class="parameter-name">Expression Noise</span>
                        <span class="parameter-value">${state.params.expressionNoise}</span>
                    </div>
                </div>
                
                <h3 style="margin: 30px 0 15px 0; color: #3498db;">Multi-Omics Integration Weights</h3>
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
            
            <!-- Mathematical Models Section -->
            <div class="section">
                <h2 class="section-title">
                    <span class="section-icon">📐</span>
                    Mathematical Models Used
                </h2>
                
                <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; border-left: 4px solid #9b59b6;">
                    <h4 style="color: #9b59b6; margin-bottom: 15px;">Gene Expression (Hill Equation):</h4>
                    <p style="font-family: 'Courier New', monospace; background: white; padding: 15px; border-radius: 5px;">
                        E<sub>gene</sub> = V<sub>max</sub> × [TF]<sup>n</sup> / (K<sub>d</sub><sup>n</sup> + [TF]<sup>n</sup>) × (1 - methylation) × (1 - mutation)
                    </p>
                    
                    <h4 style="color: #9b59b6; margin: 25px 0 15px 0;">Transcriptomics (with stochastic noise):</h4>
                    <p style="font-family: 'Courier New', monospace; background: white; padding: 15px; border-radius: 5px;">
                        T = E<sub>gene</sub> × (1 + ε), where ε ~ N(0, noise)
                    </p>
                    
                    <h4 style="color: #9b59b6; margin: 25px 0 15px 0;">Protein Dynamics (differential equation):</h4>
                    <p style="font-family: 'Courier New', monospace; background: white; padding: 15px; border-radius: 5px;">
                        dP/dt = η × T - δ × P
                    </p>
                    
                    <h4 style="color: #9b59b6; margin: 25px 0 15px 0;">Disease Risk (sigmoid model):</h4>
                    <p style="font-family: 'Courier New', monospace; background: white; padding: 15px; border-radius: 5px;">
                        Risk<sub>D</sub> = sigmoid(w₁ × f<sub>G</sub> + w₂ × f<sub>T</sub> + w₃ × f<sub>P</sub> + b<sub>D</sub>)
                    </p>
                </div>
            </div>
            
            <!-- Methodology Section -->
            <div class="section">
                <h2 class="section-title">
                    <span class="section-icon">🔬</span>
                    Methodology & Data Processing
                </h2>
                
                <p style="line-height: 1.8; margin-bottom: 20px;">
                    This analysis employed a comprehensive multi-omics approach to model gene regulation and predict disease risk. 
                    The simulation integrated three key biological layers:
                </p>
                
                <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 20px 0;">
                    <h4 style="color: #3498db; margin-bottom: 15px;">1. Genomics Layer</h4>
                    <p style="margin-bottom: 20px;">
                        Gene expression was modeled using the Hill equation, incorporating transcription factor concentration, 
                        binding affinity, cooperativity, epigenetic silencing (methylation), and genetic mutations.
                    </p>
                    
                    <h4 style="color: #2ecc71; margin-bottom: 15px;">2. Transcriptomics Layer</h4>
                    <p style="margin-bottom: 20px;">
                        mRNA levels were calculated from genomic expression with added stochastic noise to simulate biological 
                        variability and measurement uncertainty.
                    </p>
                    
                    <h4 style="color: #9b59b6; margin-bottom: 15px;">3. Proteomics Layer</h4>
                    <p>
                        Protein abundance was determined using a differential equation model incorporating translation efficiency 
                        and protein degradation rates, simulated over ${state.simulation.currentTime.toFixed(1)} hours.
                    </p>
                </div>
                
                <p style="line-height: 1.8;">
                    Disease risk was calculated by integrating normalized values from all three omics layers using 
                    disease-specific gene association weights and applying a sigmoid transformation to generate 
                    risk scores from 0-100%.
                </p>
            </div>
            
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <div class="footer-content">
                <p style="font-size: 1.2em; font-weight: 600; margin-bottom: 15px;">
                    Virtual Multi-Omics Laboratory
                </p>
                <p>
                    Developed by <strong>Shubham Mahindrakar</strong>
                </p>
                <p style="font-size: 0.9em; margin-top: 15px;">
                    © ${new Date().getFullYear()} | For educational and research purposes
                </p>
                <p style="font-size: 0.85em; margin-top: 10px; opacity: 0.8;">
                    This report was automatically generated using realistic biological models for gene regulation and disease prediction.
                </p>
            </div>
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


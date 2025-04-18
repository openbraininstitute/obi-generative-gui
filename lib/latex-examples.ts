export const latexExamples = {
    'Method.tex': `\\section{Neuron Stimulation Protocol}
  
  \\subsection{Experimental Setup}
  The stimulation protocol follows a precise temporal pattern:
  
  \\[
  V(t) = V_0 + A \\cdot \\sin(2\\pi f t)
  \\]
  
  where:
  \\begin{align*}
  V_0 &= \\text{baseline voltage (-70mV)} \\\\
  A &= \\text{amplitude (20mV)} \\\\
  f &= \\text{frequency (50Hz)}
  \\end{align*}
  
  \\subsection{Response Analysis}
  The neuronal response is characterized by the firing rate:
  
  \\[
  r(t) = \\frac{n(t)}{\\Delta t}
  \\]
  
  where $n(t)$ represents spike count in time window $\\Delta t$.`,
  
    'Rational.tex': `\\section{Theoretical Framework}
  
  The membrane potential dynamics follow the Hodgkin-Huxley model:
  
  \\[
  C_m \\frac{dV}{dt} = -\\sum_i g_i(V - E_i) + I_{ext}
  \\]
  
  where:
  \\begin{align*}
  C_m &= \\text{membrane capacitance} \\\\
  g_i &= \\text{ionic conductances} \\\\
  E_i &= \\text{reversal potentials} \\\\
  I_{ext} &= \\text{external current}
  \\end{align*}`,
  
    'ResultsSummary.tex': `\\section{Key Findings}
  
  \\subsection{Spike Timing}
  The interspike interval (ISI) distribution follows:
  
  \\[
  P(\\text{ISI}) = \\frac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{(\\text{ISI}-\\mu)^2}{2\\sigma^2}}
  \\]
  
  \\subsection{Network Effects}
  The correlation between neurons $i$ and $j$:
  
  \\[
  C_{ij} = \\frac{\\langle (r_i - \\bar{r_i})(r_j - \\bar{r_j}) \\rangle}{\\sigma_i \\sigma_j}
  \\]`
  };
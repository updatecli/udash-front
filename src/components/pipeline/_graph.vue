<template>
  <div class="graph-container">
    <vue-mermaid-string 
      :value="enhancedData" 
      :config="mermaidConfig"
    />
  </div>
</template>

<script>
import VueMermaidString from 'vue-mermaid-string'

export default {
  name: "PipelineGraphComponent",

  components: {
    VueMermaidString
  },

  props: [
    'data',
  ],

  computed: {
    enhancedData() {
      if (!this.data) return '';
      
      let graph = this.data;
      
      // Add simple class definitions for component distinction
      const classDefinitions = `
        classDef sourceClass fill:#e8f5e8,stroke:#4caf50,stroke-width:3px
        classDef conditionClass fill:#fff3e0,stroke:#ff9800,stroke-width:3px
        classDef targetClass fill:#e3f2fd,stroke:#2196f3,stroke-width:3px
        classDef actionClass fill:#f3e5f5,stroke:#9c27b0,stroke-width:3px
      `;
      
      // Apply classes based on node names
      const lines = graph.split('\n');
      const enhancedLines = lines.map(line => {
        if (!line.trim() || line.includes('-->') || line.includes('---')) {
          return line;
        }
        
        const trimmedLine = line.trim().toLowerCase();
        
        if (trimmedLine.startsWith('source')) {
          return line + ':::sourceClass';
        } else if (trimmedLine.startsWith('condition')) {
          return line + ':::conditionClass';
        } else if (trimmedLine.startsWith('target')) {
          return line + ':::targetClass';
        } else if (trimmedLine.startsWith('action')) {
          return line + ':::actionClass';
        }
        
        return line;
      });
      
      return enhancedLines.join('\n') + '\n' + classDefinitions;
    }
  },

  data: () => ({
    mermaidConfig: {
      theme: 'base',
      themeVariables: {
        primaryColor: '#f8f9fa',
        primaryTextColor: '#212529',
        primaryBorderColor: '#dee2e6',
        lineColor: '#6c757d',
        background: '#ffffff'
      },
      flowchart: {
        htmlLabels: true,
        curve: 'basis',
        padding: 20,
        nodeSpacing: 50,
        rankSpacing: 60,
        useMaxWidth: true
      },
      fontSize: 14
    }
  })
}
</script>

<style scoped>
.graph-container {
  background: white;
  padding: 20px;
  min-height: 300px;
  border-radius: 8px;
}

.graph-container :deep(.mermaid) {
  width: 100%;
  height: auto;
}
</style>
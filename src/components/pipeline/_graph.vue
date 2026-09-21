<template>
  <div class="graph-container">
    <vue-mermaid-string
      :key="themeName"
      :value="graph"
      :options="mermaidConfig"
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
    themeName() {
      return this.$vuetify.theme.global.name;
    },

    graph() {
      return this.data || '';
    },

    // Mermaid needs plain hex values, so the node and edge colours are mixed from the
    // active theme rather than read from CSS variables. Nodes stay neutral: the other
    // hues on this page already stand for pipeline results.
    mermaidConfig() {
      const colors = this.$vuetify.theme.current.colors;
      const ink = colors['on-surface'];
      const surface = colors.surface;

      return {
        theme: 'base',
        themeVariables: {
          background: surface,
          primaryColor: mix(surface, ink, 0.06),
          primaryTextColor: ink,
          primaryBorderColor: mix(surface, ink, 0.35),
          lineColor: mix(surface, ink, 0.55),
          fontFamily: 'inherit',
        },
        markdown: false,
        htmlLabels: false,
        flowchart: {
          curve: 'basis',
          padding: 20,
          nodeSpacing: 50,
          rankSpacing: 60,
          useMaxWidth: true,
        },
        fontSize: 14,
      };
    },
  },
}

function mix(from, to, amount) {
  const parse = (hex) => {
    const value = hex.replace('#', '');
    const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value;
    return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  };
  const a = parse(from);
  const b = parse(to);

  return '#' + a.map((channel, i) => Math.round(channel + (b[i] - channel) * amount)
    .toString(16).padStart(2, '0')).join('');
}
</script>

<style scoped>
.graph-container {
  background: rgb(var(--v-theme-surface));
  padding: 20px;
  min-height: 300px;
  border-radius: 8px;
}

.graph-container :deep(.mermaid) {
  width: 100%;
  height: auto;
}
</style>
<template>
  <!-- Collapsed by default: the panel body is lazy, so a 1 MiB log costs nothing until
       someone opens it. -->
  <v-expansion-panels class="console-output" variant="accordion" flat>
    <v-expansion-panel class="console-panel">
      <v-expansion-panel-title>
        <span class="console-title">
          <span class="font-weight-medium">{{ title }}</span>
          <span class="text-medium-emphasis text-body-small">{{ lineCountLabel }}</span>
        </span>
      </v-expansion-panel-title>

      <v-expansion-panel-text>
        <div class="console-toolbar">
          <p v-if="isTruncated" class="text-body-small text-medium-emphasis ma-0">
            Earlier output was cut: reports keep only the last 1 MiB.
          </p>
          <v-btn
            class="ml-auto"
            size="small"
            variant="text"
            :prepend-icon="copied ? 'mdi-check' : 'mdi-content-copy'"
            :aria-label="copied ? 'Copied' : `Copy ${title.toLowerCase()}`"
            @click="copy"
          >{{ copied ? 'Copied' : 'Copy' }}</v-btn>
        </div>
        <p v-if="copyFailed" class="text-body-medium mb-2" role="alert">
          Copying is blocked in this browser. Select the output and copy it by hand.
        </p>
        <!-- Plain text: Updatecli strips the colours before storing it, and syntax
             highlighting a log means nothing while costing a lot on large output. -->
        <pre class="console-log text-mono" tabindex="0" :aria-label="title">{{ data }}</pre>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script>
import { copyText } from '@/composables/clipboard';

// Updatecli keeps only the tail of the console output, capped at 1 MiB
// (updatecli pkg/core/pipeline/console_output.go, maxConsoleOutputSize). Output close to
// that size has lost its beginning. The margin covers multi-byte characters, which make
// the JavaScript length shorter than the byte count.
export const CONSOLE_OUTPUT_LIMIT = 1024 * 1024
const TRUNCATION_MARGIN = 1024

export default {
  name: "ConsoleOutputComponent",

  props: {
    data: { type: String, default: '' },
    title: { type: String, default: 'Console output' },
  },

  data: () => ({
    copied: false,
    copyFailed: false,
  }),

  computed: {
    lineCount() {
      const text = this.data.replace(/\n$/, '')
      return text ? text.split('\n').length : 0
    },

    lineCountLabel() {
      return this.lineCount === 1 ? '1 line' : `${this.lineCount.toLocaleString()} lines`
    },

    isTruncated() {
      return this.data.length >= CONSOLE_OUTPUT_LIMIT - TRUNCATION_MARGIN
    },
  },

  beforeUnmount() {
    clearTimeout(this.copiedTimer)
  },

  methods: {
    async copy() {
      clearTimeout(this.copiedTimer)
      this.copied = false
      this.copyFailed = false

      if (!(await copyText(this.data))) {
        this.copyFailed = true
        return
      }

      this.copied = true
      this.copiedTimer = setTimeout(() => { this.copied = false }, 2000)
    },
  },
}
</script>

<style scoped>
.console-panel {
  /* Theme border, so the outline holds on both the light and the dark surface. */
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
}

.console-title {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 4px 12px;
}

.console-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.console-log {
  margin: 0;
  padding: 12px 16px;
  max-height: 60vh;
  overflow: auto;
  /* No wrapping: log lines keep their alignment and scroll sideways instead. */
  white-space: pre;
  line-height: 1.5;
  border-radius: 4px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  color: rgb(var(--v-theme-on-surface));
}

.console-log:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}
</style>

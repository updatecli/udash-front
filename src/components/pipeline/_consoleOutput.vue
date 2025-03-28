<template>
  <v-expansion-panels>
    <v-card
      width="100%"
      flat
      density="compact"
    >
      <v-card-title>
        Console
      </v-card-title>
      <v-card-text>
        <v-expansion-panel
            class="text-body-1"
            tag="pre"
        >
          <v-expansion-panel-title>
            Output
          </v-expansion-panel-title>
          <v-expansion-panel-text>
              <code v-highlight class="language-bash">
                {{  data }}
              </code>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-card-text>
    </v-card>
  </v-expansion-panels>
</template>

<script>
    export default {
        name: "ConsoleOutputComponent",

        data: () => ({
        }),

        props: [
            'data',
        ],
    }
</script>

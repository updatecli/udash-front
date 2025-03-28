<template>
  <v-expansion-panels
  >
   {{ data.Published_at }}
    <v-card
      width="100%"
      flat
      density="compact"
    >
      <v-card-title>
          Changelog
      </v-card-title>
      <v-card-text>
        <v-expansion-panel
          v-for="(changelog, index) in data"
          :key="index"
          tag="pre"
          class="text-body-1"
          inset
        >
          <v-expansion-panel-title>
            {{  changelog.Title }}
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-card
              variant="flat"
            >
              <v-card-title></v-card-title>
              <v-card-subtitle
                v-if="changelog.PublishedAt"
              >Published at {{ changelog.PublishedAt }}</v-card-subtitle>
              <v-divider thickness="5"></v-divider>
              <v-card-text
                class="text-body-1"
                v-if="changelog.Body"
              >
                {{  changelog.Body }}
              </v-card-text>
              <v-card-text
                class="text-body-1"
                v-else
              >
                No changelog description detected
              </v-card-text>

              <v-divider thickness="5"></v-divider>
              <v-card-actions>
                <v-btn
                  v-if="changelog.URL"
                  :href="changelog.URL"
                  prepend-icon="mdi-arrow-right-circle"
                 >{{  changelog.URL }}</v-btn>
              </v-card-actions>
            </v-card>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-card-text>
    </v-card>

  </v-expansion-panels>

</template>

<script>
    export default {
        name: "ChangelogComponent",

        data: () => ({
        }),

        props: [
            'data',
        ],
    }
</script>

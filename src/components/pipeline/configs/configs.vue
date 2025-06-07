<template>
  <v-container
      class="py-8 px-6"
      fluid
  >
    <!-- Show Project Description -->
    <v-container>
      <!--
        Show Project application in a table
      -->
      <v-row>
        <v-col
            cols="4"
            v-for="config in configs"
            :key="config.ID"
          >

          <v-card
            min-height="500"
            variant="flat"
          >
            <v-card-title
              justify="center"
              align="center"
              class="text-wrap"
            >
              {{  config.Config.Name  }}
            </v-card-title>

            <v-card-subtitle
              class="text-wrap"
            >
              Kind: {{  config.Kind  }}<br>
              Time: {{  toLocalDate(config.Updated_at)  }}<br>
            </v-card-subtitle>

            <v-card-text>
              <pre
                class="py-4"
              ><code v-highlight class="language-yaml">{{  toYAML(config.Config.Spec) }}</code>
            </pre>
            </v-card-text>
            <v-card-actions>
              <v-btn
                variant="text"
                prepend-icon="mdi-eye"
                :to=getPipelineLink(config.ID)
              >
                Details
              </v-btn>
            </v-card-actions>
          </v-card>

          <!--
          <v-data-table-virtual
            v-model:items-per-page="itemsPerPage"
            :headers="pipelinesHeaders"
            :items="configs"
            item-value="name"
            fixed-header
            max-height="600px"
            :sort-by="sortBy"
          >
            <template v-slot:item.ID="{ item }">
              <v-btn
                class="mx-4"
                variant="text"
                prepend-icon="mdi-arrow-right-circle"
                :to=getPipelineLink(item.ID)></v-btn>
            </template>
            <template v-slot:item.Config="{ item }">
              <code>
                {{ item.Config.Spec }}
              </code>
            </template>
          </v-data-table-virtual>
          -->
        </v-col>
      </v-row>
    </v-container>
  </v-container>
</template>

<script>

import {toYAML } from '@/composables/yaml'
import { toLocalDate } from '@/composables/date'

import { UDASH_API_VERSION } from '@/constants';

export default {
  name: 'ConfigsTable',
  props: {
    configsFilters: {
      type: Object,
      default: () => ({})
    },
  },

  data: () => ({
    pipelinesHeaders: [
      { title: "Kind", align: "start", key:'Kind'},
      {
        title: "Data",
        align: 'start',
        sortable: true,
        key: 'Config'
      },
      { key: 'ID', sortable: false}
    ],
    configs: [],
    itemsPerPage: 25,
  }),

  watch: {
    configsFilters: {
      handler() {
        try {
          this.getConfigsData()
        } catch (error) {
          console.log(error);
        }
      },
      deep: true
    }
  },

  methods: {

    toLocalDate(rawDate) {
      return toLocalDate(rawDate)
    },

    toYAML(data) {
      // Convert the data to YAML format
      return toYAML(data);
    },

    async getConfigsData() {

      this.resourceKind = this.configsFilters.kind;
      this.resourceType = this.configsFilters.type;

      this.$emit('loaded', false)
      let queryURL = `/api/${ UDASH_API_VERSION }/pipeline/config/${this.resourceType}s/search`

      const isAuthEnabled = process.env.VUE_APP_AUTH_ENABLED === 'true';

      let jsonReqBody = {}

      if (this.resourceKind != "" && this.resourceKind !== undefined) {
        jsonReqBody.kind = this.resourceKind
      }

      if (this.resourceType != "" && this.resourceType !== undefined) {
        jsonReqBody.type = this.resourceType
      }

      if (isAuthEnabled){
        const token = await this.$auth0.getAccessTokenSilently();
        const response = await fetch(queryURL, {
            body: JSON.stringify(jsonReqBody),
            method: 'POST',
            headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await response.json();
        this.configs = data.configs
      } else {
        const response = await fetch(queryURL,
          {
            body: JSON.stringify(jsonReqBody),
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        const data = await response.json();

        if (data.configs !== undefined && data.configs !== null) {
          this.configs = data.configs;
        } else {
          console.log("No configs found");
        }
      }

      this.$emit('loaded', true)
    },
    getPipelineLink: function(id){
      return `/pipeline/configs/${this.resourceType}/${id}`
    },
  },
}
</script>

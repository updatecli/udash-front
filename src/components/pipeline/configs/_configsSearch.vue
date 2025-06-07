<template>
  <v-container
    class="py-8 px-6"
    max-width="800px"
  >
    <v-form
      v-model="filterForm"
      @submit.prevent="applyFilter"
    >
        <v-row
          align="center"
          justify="center"
        >
          <v-col
            cols="auto"
          >
            <!-- Show Resource type -->
            <v-slide-group
              v-model="configType"
              mandatory
              show-arrows
              center-active
            >
              <v-slide-group-item
                v-for="type in configTypes"
                :key="type"
                :value="type"
              >
                <v-btn
                  variant="text"
                  :class="{ 'v-btn--active': configType === type }"
                  @click="configType = type"
                >
                  {{ type }}
                </v-btn>
              </v-slide-group-item>
            </v-slide-group>
          </v-col>
        </v-row>

        <!-- Show Resource Kind for a type -->
        <v-row
          align="center"
          justify="center"
        >
          <v-col
            cols="auto"
          >
            <v-slide-group
              v-model="configKind"
              mandatory
              show-arrows
              center-active
            >
              <v-slide-item
                v-for="kind in configKinds"
                :key="kind"
                :value="kind"
                class="mx-2"
              >
                <v-btn
                  variant="text"
                  :class="{ 'v-btn--active': configKind === kind }"
                  @click="configKind= kind"
                >
                  {{ kind }}
                </v-btn>
              </v-slide-item>
            </v-slide-group>
          </v-col>
        </v-row>

        <v-row
          align="center"
          justify="center"
        >
          <v-col
            cols="auto"
          >
            <v-btn
              @click="applyFilter"
            >Search</v-btn>
          </v-col>
        </v-row>
    </v-form>
  </v-container>
</template>

<script>

import { UDASH_API_VERSION } from '@/constants';

export default {
  name: 'ConfigsSearchFilter',

  data: () => ({
    filterForm: false,
    configKind: "",
    configKinds: [],
    configType: "source",
    configTypes: [
      "source",
      "condition",
      "target"
    ],
  }),

  beforeUnmount() {
    this.cancelAutoUpdate();
  },

  watch: {
    configType: function () {
      this.getConfigsKindData()
    },
  },

  methods: {
    async getConfigsKindData() {
      this.$emit('loaded', false)
      const auth_enabled = process.env.VUE_APP_AUTH_ENABLED === 'true';

      let query = `/api/${ UDASH_API_VERSION }/pipeline/config/kinds?type=${this.configType}`;

      if (auth_enabled) {
        const token = await this.$auth0.getAccessTokenSilently();

        const response = await fetch(query, {
            headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await response.json();
        console.log(response)
        this.configKinds = data.data
      } else {

        const response = await fetch(query);
        const data = await response.json();
        this.configKinds = data.data
        this.configKind = this.configKinds[0] || "";
      }
      this.$emit('loaded', true)
    },

    applyFilter() {
      let jsonReqBody = {
        kind: this.configKind,
        type: this.configType
      }
      this.$emit('filters', jsonReqBody)
    },

    cancelAutoUpdate() {
      clearInterval(this.timer);
    },
  },

  async created() {
    try {
      this.getConfigsKindData()
    } catch (error) {
      console.log(error);
    }
  },
}
</script>

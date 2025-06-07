<template>
  <v-app>
    <HeadNavigation/>
    <SideNavigation/>

    <v-main>
      <v-overlay
        :model-value="isLoading"
        class="align-center justify-center"
        :disabled=true
        :eager=true
        :no-click-animation=true
        :persistent=true
        :opacity="0"
      >
        <v-progress-circular
          color="black"
          indeterminate
          size="64"
        ></v-progress-circular>
      </v-overlay>
      <v-container>
        <v-row>
          <v-col
            class="text-right"
            cols="auto"
            lg="8"
            md="8"
            sm="12"
          >
          <h1>
            Configs <v-icon icon="mdi-transit-connection-variant"></v-icon>
          </h1>
          </v-col>
        </v-row>
      </v-container>

      <PipelineConfigsSearch
        @loaded="setConfigsLoaded"
        @filters="setConfigsFilters"
      />

      <PipelineConfigs
        @loaded="setConfigsLoaded"
        v-model:configsFilters=configsFilters
      />
    </v-main>

    <ReleaseFooter/>
  </v-app>
</template>

<script>

import ReleaseFooter from '../../components/ReleaseFooter.vue';
import SideNavigation from '../../components/SideNavigation.vue';
import HeadNavigation from '../../components/HeadNavigation.vue';
import PipelineConfigs from '../../components/pipeline/configs/configs.vue';
import PipelineConfigsSearch from '@/components/pipeline/configs/_configsSearch.vue';

export default {
  name: 'PipelineConfigsView',
  beforeUnmount() {
    this.cancelAutoUpdate();
  },
  components: {
    ReleaseFooter,
    SideNavigation,
    HeadNavigation,
    PipelineConfigs,
    PipelineConfigsSearch,
  },
  data: () => ({
    links:[
      {
      name: "Updatecli",
      to: "https://www.updatecli.io",
      icon: "mdi-arrow-right-circle",
      },
    ],
    isConfigsLoaded: false,
    isFiltersLoaded: false,
    isLoading: true,
    configsFilters: {
      "type": "source"
    },
    configs: {},
  }),

  watch: {
    isConfigsLoaded: function() {
        this.isLoading = !this.isAllComponentsLoaded()
    },
    isLoading: function (val) {
      val && setTimeout(() => {
        this.isLoading = false
      }, 10000)
    },
    configs: function() {
      if (this.isConfigsLoaded) {
        this.isLoading = false
      }
    },
  },

  methods: {
    cancelAutoUpdate: function() {
      clearInterval(this.timer);
    },
    setConfigsLoaded: function(state) {
      this.isConfigsLoaded = state;
    },
    setConfigsFilters: function(filters) {
      this.configsFilters = filters;
    },
    isAllComponentsLoaded: function() {
      if (this.isConfigsLoaded) {
        return true
      }
      return false
    },
  }
}
</script>
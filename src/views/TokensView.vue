<template>
  <v-container class="page-shell">
    <section class="pb-8">
      <PageTitle
        title="API tokens"
        icon="mdi-key"
        tooltip="API tokens let Updatecli publish reports without signing in. Unlike a login session they do not expire, so a pipeline can keep one for as long as it runs unattended."
      >
        <template v-slot:actions>
          <v-btn
            v-if="canCreate"
            color="primary"
            prepend-icon="mdi-plus"
            @click="openCreateDialog"
          >
            New token
          </v-btn>
        </template>

        <template v-slot:subtitle>
          Use a token with <code>UPDATECLI_UDASH_ACCESS_TOKEN</code>, or run
          <code>updatecli udash login</code> and paste it when prompted.
        </template>
      </PageTitle>

      <!-- The token is shown once and cannot be recovered afterwards, so this has to
           be impossible to miss and must not disappear on its own. -->
      <v-alert
        v-if="createdToken"
        type="success"
        variant="tonal"
        class="mb-6"
        closable
        @click:close="createdToken = null"
      >
        <div class="font-weight-medium mb-1">Copy your token now</div>
        <div class="text-body-medium mb-3">
          This is the only time it is shown. Once you leave this page it cannot be
          recovered, only replaced.
        </div>
        <div class="token-block">
          <v-btn
            class="copy-btn"
            :icon="copied ? 'mdi-check' : 'mdi-content-copy'"
            size="small"
            variant="text"
            aria-label="Copy token"
            @click="copyToken"
          ></v-btn>
          <pre class="overflow-x-auto"><code>{{ createdToken }}</code></pre>
        </div>
      </v-alert>

      <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-4">
        {{ error }}
      </v-alert>

      <v-card variant="flat" class="pa-4 pa-sm-6">
        <div v-if="loading" class="text-center py-8">
          <v-progress-circular indeterminate size="48"></v-progress-circular>
        </div>

        <div v-else-if="tokens.length === 0" class="text-center py-8">
          <v-icon size="96" color="grey-lighten-2">mdi-key-outline</v-icon>
          <h3 class="text-headline-small mt-6 mb-2 font-weight-medium">No Tokens Yet</h3>
          <p class="text-body-medium text-grey-darken-1">
            <template v-if="canCreate">
              Create one to let Updatecli publish reports from your pipelines.
            </template>
            <template v-else>
              Your account is not allowed to create API tokens. Ask an administrator
              for the <code>publisher</code> role.
            </template>
          </p>
        </div>

        <v-data-table-virtual
          v-else
          :headers="headers"
          :items="tokens"
          fixed-header
          max-height="600px"
        >
          <template v-slot:item.scopes="{ item }">
            <v-chip
              v-for="scope in item.scopes"
              :key="scope"
              size="x-small"
              class="mr-1"
              label
            >
              {{ scope }}
            </v-chip>
          </template>

          <template v-slot:item.created_at="{ item }">
            {{ toLocalDate(item.created_at) }}
          </template>

          <template v-slot:item.last_used_at="{ item }">
            {{ item.last_used_at ? toLocalDate(item.last_used_at) : 'Never' }}
          </template>

          <template v-slot:item.expires_at="{ item }">
            {{ item.expires_at ? toLocalDate(item.expires_at) : 'Never' }}
          </template>

          <template v-slot:item.actions="{ item }">
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="text"
              :aria-label="`Revoke ${item.name}`"
              @click="confirmRevoke(item)"
            ></v-btn>
          </template>
        </v-data-table-virtual>
      </v-card>
    </section>

    <!-- Create -->
    <v-dialog v-model="createDialog" max-width="520">
      <v-card>
        <v-card-title>New API token</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="form.name"
            label="Name"
            placeholder="ci"
            hint="What this token is for, so you can recognise it later."
            persistent-hint
            variant="outlined"
            autofocus
            class="mb-4"
          ></v-text-field>

          <div class="text-label-large mb-1">Permissions</div>
          <v-checkbox
            v-for="scope in availableScopes"
            :key="scope.value"
            v-model="form.scopes"
            :value="scope.value"
            :label="scope.label"
            :hint="scope.hint"
            persistent-hint
            density="compact"
            hide-details="auto"
          ></v-checkbox>

          <v-alert
            v-if="createError"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-4"
          >
            {{ createError }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="createDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            :loading="creating"
            :disabled="!form.name || form.scopes.length === 0"
            @click="createToken"
          >
            Create
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Revoke -->
    <v-dialog v-model="revokeDialog" max-width="440">
      <v-card>
        <v-card-title>Revoke this token?</v-card-title>
        <v-card-text>
          Anything still using <strong>{{ revoking?.name }}</strong> stops working
          immediately. This cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="revokeDialog = false">Cancel</v-btn>
          <v-btn color="error" :loading="revokingBusy" @click="revokeToken">Revoke</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { apiFetch } from '@/composables/api';
import { toLocalDate } from '@/composables/date';
import PageTitle from '@/components/PageTitle.vue';

export default {
  name: 'TokensView',
  components: {
    PageTitle,
  },
  data: () => ({
    tokens: [],
    loading: true,
    error: null,

    permission: '',

    createDialog: false,
    creating: false,
    createError: null,
    createdToken: null,
    copied: false,
    form: {
      name: '',
      scopes: ['reports:write'],
    },

    revokeDialog: false,
    revoking: null,
    revokingBusy: false,

    headers: [
      { title: 'Name', key: 'name', align: 'start' },
      { title: 'Permissions', key: 'scopes', align: 'start', sortable: false },
      { title: 'Created', key: 'created_at', align: 'start' },
      { title: 'Last used', key: 'last_used_at', align: 'start' },
      { title: 'Expires', key: 'expires_at', align: 'start' },
      { title: '', key: 'actions', align: 'end', width: '64px', sortable: false },
    ],

    availableScopes: [
      {
        value: 'reports:write',
        label: 'Publish reports',
        hint: 'What Updatecli needs to send pipeline reports.',
      },
      {
        value: 'reports:read',
        label: 'Read reports',
        hint: 'Read access to the reports already published.',
      },
    ],
  }),
  computed: {
    // The API is what actually enforces this; hiding the button just avoids
    // offering an action which is going to be refused.
    canCreate() {
      return this.permission === 'publisher' || this.permission === 'admin';
    },
  },
  async created() {
    await Promise.all([this.getPermission(), this.getTokens()]);
  },
  methods: {
    toLocalDate,

    async getPermission() {
      try {
        const data = await apiFetch('/whoami');
        this.permission = data?.permission || '';
      } catch (error) {
        console.error('Error fetching identity:', error);
      }
    },

    async getTokens() {
      this.loading = true;
      try {
        const data = await apiFetch('/tokens');
        this.tokens = data || [];
        this.error = null;
      } catch (error) {
        console.error('Error fetching tokens:', error);
        this.error = error.message;
        this.tokens = [];
      }
      this.loading = false;
    },

    openCreateDialog() {
      this.form = { name: '', scopes: ['reports:write'] };
      this.createError = null;
      this.createDialog = true;
    },

    async createToken() {
      this.creating = true;
      try {
        const data = await apiFetch('/tokens', {
          method: 'POST',
          body: { name: this.form.name, scopes: this.form.scopes },
        });
        this.createdToken = data.token;
        this.copied = false;
        this.createDialog = false;
        await this.getTokens();
      } catch (error) {
        console.error('Error creating token:', error);
        this.createError = error.message;
      }
      this.creating = false;
    },

    confirmRevoke(token) {
      this.revoking = token;
      this.revokeDialog = true;
    },

    async revokeToken() {
      this.revokingBusy = true;
      try {
        await apiFetch(`/tokens/${this.revoking.id}`, { method: 'DELETE' });
        this.revokeDialog = false;
        await this.getTokens();
      } catch (error) {
        console.error('Error revoking token:', error);
        this.error = error.message;
      }
      this.revokingBusy = false;
    },

    copyToken() {
      if (!navigator.clipboard) {
        return;
      }
      navigator.clipboard.writeText(this.createdToken).then(() => {
        this.copied = true;
        setTimeout(() => {
          this.copied = false;
        }, 1500);
      });
    },
  },
};
</script>

<style scoped>
/* Position the copy button in the top-right corner of the token block. */
.token-block {
  position: relative;
  min-width: 0;
}

.token-block .copy-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 1;
}

/* A token is one long unbreakable string: let it scroll rather than widen the page. */
.token-block pre {
  margin: 0;
  padding: 8px 48px 8px 12px;
  border-radius: 4px;
  background: rgba(127, 127, 127, 0.12);
}
</style>

<template>
    <v-footer
        class="d-flex align-center justify-center ga-2"
        app
        height="48"
        color="background"
    >
        <v-btn
            icon="mdi-github"
            aria-label="Updatecli on GitHub"
            variant="text"
            size="small"
            href="https://github.com/updatecli"
        ></v-btn>
        <div>
            {{ new Date().getFullYear() }} — <strong>© Updatecli Project</strong>
        </div>
    </v-footer>
</template>

<script>
    export default {
        name: "ReleaseFooter",
    }
</script>

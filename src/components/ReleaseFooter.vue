<template>
    <v-footer
        class="text-center d-flex flex-column"
        app
        bottom
        fixed
        padless
    >
        <div>
            <v-btn class="mx-4" icon="mdi-github"  variant="text" href="https://github.com/updatecli"></v-btn>
            <v-btn class="mx-4" icon="mdi-twitter" variant="text" href="https://twitter.com/updatecliio"></v-btn>
        </div>
        <div>
            {{ new Date().getFullYear() }} — <strong>© Vernin Olivier</strong>
        </div>
    </v-footer>
</template>

<script>
    export default {
        name: "ReleaseFooter",
    }
</script>
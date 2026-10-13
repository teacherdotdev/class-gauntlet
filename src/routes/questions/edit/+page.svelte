<script lang="ts">
  // Question sets became Question banks: old links (and share links) still land.
  import { goto } from '$app/navigation';
  goto(`/banks/edit${location.search}${location.hash}`, { replaceState: true });
</script>

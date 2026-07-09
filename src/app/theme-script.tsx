export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              var stored = localStorage.getItem('our-story-settings');
              if (stored) {
                var parsed = JSON.parse(stored);
                if (parsed.state && parsed.state.darkMode) {
                  document.documentElement.classList.add('dark');
                }
              }
            } catch(e) {}
          })();
        `,
      }}
    />
  );
}

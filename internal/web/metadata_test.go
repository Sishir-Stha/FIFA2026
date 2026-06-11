package web

import (
	"net/http/httptest"
	"strings"
	"testing"
)

func TestInjectInviteMetadata(t *testing.T) {
	index := `<!doctype html><html><head><title>Yeti Airlines</title></head><body><div id="app"></div></body></html>`
	page := injectInviteMetadata(index, inviteMeta{
		PageTitle:   "Join Test League · Yeti Airlines",
		Title:       inviteOGTitle,
		Description: inviteOGDescription,
		URL:         "https://vm.midttunet.no/join/ABC123",
		ImageURL:    "https://vm.midttunet.no/screenshots/Frontpage.png",
	})

	checks := []string{
		`<title>Join Test League · Yeti Airlines</title>`,
		`property="og:title" content="Join my World Cup prediction league on Yeti Airlines!"`,
		`property="og:description" content="Open the invitation to compete with me."`,
		`property="og:image" content="https://vm.midttunet.no/screenshots/Frontpage.png"`,
		`name="twitter:card" content="summary_large_image"`,
	}
	for _, check := range checks {
		if !strings.Contains(page, check) {
			t.Fatalf("expected injected HTML to contain %q\n%s", check, page)
		}
	}
}

func TestRequestOriginUsesForwardedHeaders(t *testing.T) {
	req := httptest.NewRequest("GET", "http://127.0.0.1:8091/join/ABC123", nil)
	req.Header.Set("X-Forwarded-Proto", "https")
	req.Header.Set("X-Forwarded-Host", "vm.midttunet.no")

	if got := requestOrigin(req); got != "https://vm.midttunet.no" {
		t.Fatalf("requestOrigin() = %q", got)
	}
}

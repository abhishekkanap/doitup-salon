# DNS-AID

DNS-AID records cannot be published from a GitHub Pages repository. They must be created in the DNS provider for the production domain.

Recommended records for the site owner to configure at the DNS provider:

```text
_index._agents.example.com. HTTPS 1 . alpn="h2" endpoint="/.well-known/agent-skills/index.json"
_api._agents.example.com. HTTPS 1 . alpn="h2" endpoint="/.well-known/api-catalog"
```

Replace `example.com` with the production domain and enable DNSSEC if the DNS provider supports it.


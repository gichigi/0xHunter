# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions receive security updates depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not** open a public issue. Instead, please report it via one of the following methods:

- **Email**: Open an issue on GitHub with the "Security" label (private)
- **GitHub Security Advisory**: Use GitHub's private vulnerability reporting feature if available

Please include:
- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will acknowledge receipt of your report within 48 hours and provide a detailed response within 7 days.

## Security Best Practices

When using 0xHunter:

- **Never commit API keys** - Always use environment variables
- **Keep dependencies updated** - Run `pnpm update` regularly
- **Use HTTPS** - Always use HTTPS in production
- **Validate inputs** - The app validates queries, but be cautious with user input
- **Rate limiting** - Be aware of API rate limits (Alchemy, OpenAI, CoinGecko)

## Known Security Considerations

- API keys are stored in environment variables (never in code)
- No user authentication (public tool)
- No data storage (queries are stateless)
- Results are stored in URL params (be cautious sharing sensitive addresses)


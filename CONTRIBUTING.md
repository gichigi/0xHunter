# Contributing to 0xHunter

Thank you for your interest in contributing to 0xHunter! This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/0xHunter.git`
3. Install dependencies: `pnpm install`
4. Create a branch: `git checkout -b feature/your-feature-name`
5. Make your changes
6. Test your changes: `pnpm dev`
7. Commit your changes: `git commit -m "feat: your feature description"`
8. Push to your fork: `git push origin feature/your-feature-name`
9. Open a Pull Request

## Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow existing code style and patterns
- Use `pnpm` for package management (not `npm`)
- Keep functions focused and single-purpose
- Add clear, concise comments where needed

### Commit Messages

Follow conventional commit format:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `refactor:` for code refactoring
- `test:` for adding tests
- `chore:` for maintenance tasks

### Testing

- Test your changes locally before submitting
- Ensure the app builds successfully: `pnpm build`
- Test with various query types (address analysis, token price, NFT ownership)

## V1 Scope

Please review [ROADMAP.md](ROADMAP.md) before contributing. V1 has a focused scope:

**Supported:**
- Single-address analysis queries
- Token price queries
- NFT collection ownership queries

**Deferred to Post-V1:**
- Multi-address comparisons
- Transfer history analytics
- Token/NFT holder queries
- Complex analytics
- Dynamic NFT collection lookup

If you're working on a post-V1 feature, please open an issue first to discuss.

## Pull Request Process

1. Ensure your code follows the project's style guidelines
2. Update documentation if needed (README.md, ROADMAP.md)
3. Ensure all tests pass (if applicable)
4. Request review from maintainers
5. Address any feedback

## Questions?

Open an issue for questions, bug reports, or feature requests.

Thank you for contributing to 0xHunter! 🎯


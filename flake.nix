{
  description = "Arcane Orion Blog Development Environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          name = "arcane-orion-blog";
          
          buildInputs = with pkgs; [
            nodejs_22
            git
          ];

          shellHook = ''
            echo "🚀 Arcane Orion Blog Dev Environment"
            echo "Node.js: $(node --version)"
            echo ""
            echo "Available commands:"
            echo "  npm install    - Install dependencies"
            echo "  npm run dev    - Start dev server (http://localhost:4321)"
            echo "  npm run build  - Build static site"
            echo "  npm run preview- Preview built site"
            echo ""
          '';
        };
      }
    );
}
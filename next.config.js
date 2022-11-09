/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['pbs.twimg.com'],
  },
  reactStrictMode: true,
  webpack: (config, options) => {
    config.module.rules.push({
      test: /\.(glsl|frag|vert)$/,
      use: [
        options.defaultLoaders.babel,
        {loader: 'raw-loader'},
        {loader: 'glslify-loader', options: {
          transform: [
            ['glslify-hex', {'option-1': true, 'option-2': 42}],
          ],
        }},
      ],
      exclude: /node_modules/,
    });
    return config;
  },
};

module.exports = nextConfig;



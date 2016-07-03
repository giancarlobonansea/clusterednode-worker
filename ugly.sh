#!/usr/bin/env bash
echo Minify nodeworker2.js
uglifyjs nodeworker2.js --screw-ie8 -c sequences,dead_code,conditionals,comparisons,unsafe_comps,evaluate,booleans,loops,unused,if_return,join_vars,collapse_vars,cascade,passes=3 -m toplevel,eval -r '$,require,exports' -o nodeworker2.js --source-map nodeworker2.js.map --source-map-include-sources
echo Minify http2 package
uglifyjs node_modules/http2/lib/http.js --screw-ie8 -c -m -r '$,require,exports' -o node_modules/http2/lib/http.js
uglifyjs node_modules/http2/lib/index.js --screw-ie8 -c -m -r '$,require,exports' -o node_modules/http2/lib/index.js
uglifyjs node_modules/http2/lib/protocol/compressor.js --screw-ie8 -c -m -r '$,require,exports' -o node_modules/http2/lib/protocol/compressor.js
uglifyjs node_modules/http2/lib/protocol/connection.js --screw-ie8 -c -m -r '$,require,exports' -o node_modules/http2/lib/protocol/connection.js
uglifyjs node_modules/http2/lib/protocol/endpoint.js --screw-ie8 -c -m -r '$,require,exports' -o node_modules/http2/lib/protocol/endpoint.js
uglifyjs node_modules/http2/lib/protocol/flow.js --screw-ie8 -c -m -r '$,require,exports' -o node_modules/http2/lib/protocol/flow.js
uglifyjs node_modules/http2/lib/protocol/framer.js --screw-ie8 -c -m -r '$,require,exports' -o node_modules/http2/lib/protocol/framer.js
uglifyjs node_modules/http2/lib/protocol/stream.js --screw-ie8 -c -m -r '$,require,exports' -o node_modules/http2/lib/protocol/stream.js
uglifyjs node_modules/http2/lib/protocol/index.js --screw-ie8 -c -m -r '$,require,exports' -o node_modules/http2/lib/protocol/index.js
echo Minify ioredis package
uglifyjs node_modules/ioredis/index.js --screw-ie8 -c -m -r '$,require,exports' -o node_modules/ioredis/index.js
uglifyjs node_modules/ioredis/lib/cluster/connection_pool.js --screw-ie8 -c -m -r '$,require,exports' -o node_modules/ioredis/lib/cluster/connection_pool.js
uglifyjs node_modules/ioredis/lib/cluster/delay_queue.js --screw-ie8 -c -m -r '$,require,exports' -o node_modules/ioredis/lib/cluster/delay_queue.js
uglifyjs node_modules/ioredis/lib/cluster/index.js --screw-ie8 -c -m -r '$,require,exports' -o node_modules/ioredis/lib/cluster/index.js
uglifyjs node_modules/ioredis/lib/connectors/connector.js --screw-ie8 -c -m -r '$,require,exports' -o node_modules/ioredis/lib/connectors/connector.js
uglifyjs node_modules/ioredis/lib/connectors/sentinel_connector.js --screw-ie8 -c -m -r '$,require,exports' -o node_modules/ioredis/lib/connectors/sentinel_connector.js
uglifyjs node_modules/ioredis/lib/redis/event_handler.js --screw-ie8 -c -m -r '$,require,exports' -o node_modules/ioredis/lib/redis/event_handler.js
uglifyjs node_modules/ioredis/lib/redis/parser.js --screw-ie8 -c -m -r '$,require,exports' -o node_modules/ioredis/lib/redis/parser.js
uglifyjs node_modules/ioredis/lib/utils/index.js --screw-ie8 -c -m -r '$,require,exports' -o node_modules/ioredis/lib/utils/index.js
uglifyjs node_modules/ioredis/lib/command.js --screw-ie8 -c -m -r '$,require,exports' -o node_modules/ioredis/lib/command.js
uglifyjs node_modules/ioredis/lib/commander.js --screw-ie8 -c -m -r '$,require,exports' -o node_modules/ioredis/lib/commander.js
uglifyjs node_modules/ioredis/lib/pipeline.js --screw-ie8 -c -m -r '$,require,exports' -o node_modules/ioredis/lib/pipeline.js
uglifyjs node_modules/ioredis/lib/redis.js --screw-ie8 -c -m -r '$,require,exports' -o node_modules/ioredis/lib/redis.js
uglifyjs node_modules/ioredis/lib/reply_error.js --screw-ie8 -c -m -r '$,require,exports' -o node_modules/ioredis/lib/reply_error.js
uglifyjs node_modules/ioredis/lib/scan_stream.js --screw-ie8 -c -m -r '$,require,exports' -o node_modules/ioredis/lib/scan_stream.js
uglifyjs node_modules/ioredis/lib/script.js --screw-ie8 -c -m -r '$,require,exports' -o node_modules/ioredis/lib/script.js
uglifyjs node_modules/ioredis/lib/subscription_set.js --screw-ie8 -c -m -r '$,require,exports' -o node_modules/ioredis/lib/subscription_set.js
uglifyjs node_modules/ioredis/lib/transaction.js --screw-ie8 -c -m -r '$,require,exports' -o node_modules/ioredis/lib/transaction.js
echo Finished minifying files

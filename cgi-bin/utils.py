#!/usr/bin/env python
#  This file is part of Leash (Browser Shell)
#  Copyright (C) 2013-2014  Jakub Jankiewicz <http://jcubic.pl>
#
#  Released under the MIT license

import os, re, json
from cgi import parse_qs
from time import time

try:
    from hashlib import md5
except ImportError:
    import md5 as _md5
    md5 = _md5.new

def uniq_id():
    return md5(str(time())).hexdigest()

def valid_token():
    query = parse_qs(os.environ['QUERY_STRING'])
    if not query.has_key('token'):
        return False
    else:
        token = query['token'][0]
        # at least md5 hash
        if re.match("^[0-9a-f]{32,}$", token):
            # share token from php
            config = json.loads(open('../config.json').read())
            for session in config['sessions']:
                if session['token'] == token:
                    return True
        return False

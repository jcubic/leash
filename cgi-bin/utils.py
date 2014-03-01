#!/usr/bin/env python
#  This file is part of Bush (Browser Unix Shell)
#  Copyright (C) 2013  Jakub Jankiewicz <http://jcubic.pl>
#
#  This program is free software: you can redistribute it and/or modify
#  it under the terms of the GNU General Public License as published by
#  the Free Software Foundation, either version 3 of the License, or
#  (at your option) any later version.
#
#  This program is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU General Public License for more details.
#
#  You should have received a copy of the GNU General Public License
#  along with this program.  If not, see <http://www.gnu.org/licenses/>.

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
            config = json.parse(open('../config.json').read())
            for session in config['sessions']:
                if session['token'] == token:
                    return True
        return False

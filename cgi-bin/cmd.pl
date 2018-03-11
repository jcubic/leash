#!/usr/bin/perl -w
#  This file is part of Leash (Browser Shell)
#  Copyright (C) 2013-2018  Jakub Jankiewicz <http://jcubic.pl/me>
#
#  Released under the MIT license
#

use strict;
use warnings;
use lib qw(.);

use Leash qw(&valid_token);

print "Content-Type: text/plain\r\n\r\n";

if ($ENV{'REMOTE_ADDR'} eq $ENV{'SERVER_ADDR'}) {
    if (valid_token($ENV{'QUERY_STRING'})) { 
        system(join("", <STDIN>));
    } else {
        print "wrong token";
    }
} else {
    print "invalid host";
}

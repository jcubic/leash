#!/usr/bin/perl
#  This file is part of Leash (Browser Shell)
#  Copyright (C) 2013-2014  Jakub Jankiewicz <http://jcubic.pl>
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

use strict;
use warnings;
use lib qw(..);
use JSON qw( );

sub valid_token {
    my $filename = '../config.json';

    my $json_text = do {
        open(my $json_fh, "<:encoding(UTF-8)", $filename)
            or die("Can't open \$filename\": $!\n");
        local $/;
        <$json_fh>
    };

    my $json = JSON->new;
    my $config = $json->decode($json_text);

    for ( @{$config->{sessions}} ) {
        if ($ENV{'QUERY_STRING'} eq $_->{token}) {
            return 1;
        }
    }
    return 0;
}

if ($ENV{'REMOTE_ADDR'} eq $ENV{'SERVER_ADDR'}) {
    if (valid_token()) {
        print "Content-Type: text/plain\n\n";
        system(join("", <STDIN>));
    }
}

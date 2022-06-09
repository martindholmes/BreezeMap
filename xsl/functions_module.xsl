<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:xd="http://www.oxygenxml.com/ns/doc/xsl"
    exclude-result-prefixes="#all"
    xmlns:hcmc="http://hcmc.uvic.ca/ns"
    xmlns="http://www.tei-c.org/ns/1.0"
    xpath-default-namespace="http://www.tei-c.org/ns/1.0"
    xmlns:fn="http://www.w3.org/2005/xpath-functions"
    xmlns:xh="http://www.w3.org/1999/xhtml"
    version="3.0">
    <xd:doc scope="stylesheet">
        <xd:desc>
            <xd:p><xd:b>Created in:</xd:b> April 2021.</xd:p>
            <xd:p><xd:b>Author:</xd:b> mholmes</xd:p>
            <xd:p>This is a module for XSLT functions that will benefit from
            having explicit XSpec testing outside of their use context.</xd:p>
        </xd:desc>
    </xd:doc>
    
  <xd:doc>
    <xd:desc><xd:ref name="maxTimelinePoints" type="param" as="xs:integer">maxTimelinePoints</xd:ref> is the 
    maximum number of discrete points that should be permitted on a timeline control; this is a configurable
    parameter defaulting to 100, and is used to calculate the granularity of the timeline.</xd:desc>
  </xd:doc>
  <xsl:param name="maxTimelinePoints" as="xs:integer" select="100"/>
  
  <xd:doc>
    <xd:desc><xd:ref name="selfClosingXhtmlElements" type="variable">selfClosingXhtmlElements</xd:ref>
    is a sequence of strings representing element names which should be rendered as self-closing.</xd:desc>
  </xd:doc>
  <xsl:variable name="selfClosingXhtmlElements" select="('area', 'base', 'head', 'br', 'col', 'colgroup', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'video', 'audio', 'wbr')"/>
  
  <xd:doc>
    <xd:desc><xd:ref type="variable" name="dtPictureString">The formatting string for ISO 8601 dateTime values.</xd:ref></xd:desc>
  </xd:doc>
  <xsl:variable name="dtPictureString" as="xs:string">[Y0001]-[M01]-[D01]T[H01]:[m01]:[s01]</xsl:variable>

  
  <xd:doc>
    <xd:desc><xd:ref name="quot" type="variable">quot</xd:ref>
      is a handy var containing a double-quote.</xd:desc>
  </xd:doc>
  <xsl:variable name="quot">"</xsl:variable>
  
  <!-- One template belongs here. -->
  
  <xd:doc>
    <xd:desc>This template turns XHTML5 into serialized strings suitable for inclusing in 
    GeoJSON.</xd:desc>
  </xd:doc>
  <xsl:template mode="escape" match="xh:*" as="xs:string*">
    <xsl:variable name="n" select="local-name(.)"/>
    <xsl:text>&lt;</xsl:text><xsl:value-of select="$n"/>
    <!--<xsl:if test="not(parent::xh:*)">
      <xsl:text> xmlns="http://www.w3.org/1999/xhtml"</xsl:text>
    </xsl:if>-->
    <xsl:for-each select="@*"><xsl:text> </xsl:text><xsl:value-of select="concat(local-name(.), '=', $quot, ., $quot)"/></xsl:for-each>
    <xsl:choose>
      <xsl:when test="$n = $selfClosingXhtmlElements"><xsl:text>/&gt;</xsl:text></xsl:when>
      <xsl:otherwise>
        <xsl:text>&gt;</xsl:text><xsl:apply-templates mode="#current"/><xsl:text>&lt;/</xsl:text><xsl:value-of select="$n"/><xsl:text>&gt;</xsl:text>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>
    
  <xd:doc>
    <xd:desc><xd:ref type="function" name="hcmc:createEscapedXhtml">hcmc:createEscapedXhtml</xd:ref>
      takes TEI, turns it into XHTML5, then spits out the results 
      as a serialized string. Used for transforming TEI into XHTML5 blocks
      which can be output as strings in the GeoJSON. </xd:desc>
    <xd:param name="el" as="element()">A TEI element.</xd:param>
  </xd:doc>
  <xsl:function name="hcmc:createEscapedXhtml" as="xs:string">
    <xsl:param name="el" as="element()"/>
    <xsl:variable name="xhtml" as="node()*"><xsl:apply-templates select="$el" mode="xhtml5"/></xsl:variable>
    <xsl:variable name="escapedXhtml" as="xs:string*"><xsl:apply-templates select="$xhtml" mode="escape"/></xsl:variable>
    <xsl:value-of select="normalize-space(string-join($escapedXhtml, ''))"/>
  </xsl:function>
  
  <xd:doc>
    <xd:desc><xd:ref name="hcmc:getTimelineAsStrings">hcmc:getTimelineAsStrings</xd:ref> is a recursive
    function which builds a sequence of ISO datetime ranges (slash delimited) which will serve as the 
    basis for the HTML timeline control. </xd:desc>
    <xd:param name="soFar" as="xs:string*">The sequence built up so far.</xd:param>
    <xd:param name="currRangeStart" as="xs:dateTime">The next point from which to build the next range.</xd:param>
    <xd:param name="range" as="xs:duration">The range up to the next point.</xd:param>
    <xd:param name="terminus" as="xs:dateTime">The point beyond which we don't need to go.</xd:param>
  </xd:doc>
  <xsl:function name="hcmc:getTimelineAsStrings" as="xs:string*">
    <xsl:param name="soFar" as="xs:string*"/>
    <xsl:param name="currRangeStart" as="xs:dateTime"/>
    <xsl:param name="range" as="xs:duration"/>
    <xsl:param name="terminus" as="xs:dateTime"/>
    <xsl:choose>
      <xsl:when test="$currRangeStart ge $terminus">
        <xsl:sequence select="$soFar"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:variable as="xs:dateTime" name="nextRangeStart" select="$currRangeStart + $range"/>
        <xsl:variable as="xs:dateTime" name="currRangeEnd" select="$nextRangeStart - xs:dayTimeDuration('PT1S')"/>
        <xsl:variable name="strCurrRange" as="xs:string" select="format-dateTime($currRangeStart, $dtPictureString) || '/' || format-dateTime($currRangeEnd, $dtPictureString)"/>
        <xsl:variable name="rangeLabel" select="hcmc:getRangeLabel($strCurrRange, $range)"/>
        <xsl:sequence select="hcmc:getTimelineAsStrings(
          ($soFar, $strCurrRange || '/' || $rangeLabel), 
          $nextRangeStart, 
          $range, 
          $terminus
          )"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:function>
  
  <xd:doc>
    <xd:desc><xd:ref type="function" name="hcmc:getRangeLabel" as="xs:string*">hcmc:getRangeLabel</xd:ref>
      receives a string with a slash-delimited ISO 8601 dateTime range, along with a duration,
      and returns a string representing a human-readable version of the range suitable for a 
      label for a timeline point on the map. For example, given 1969-01-01T00:00:00/1969-12-31T23:59:59,
      duration 1 year, it would return "1969"; given 1969-01-01T00:00:00/1974-12-31T23:59:59, 
      duration 5 years, it would return "1969-1974".</xd:desc>
    <xd:param name="strRange" as="xs:string">The slash-delimited range.</xd:param>
    <xd:param name="durRange" as="xs:duration">The period between them.</xd:param>
  </xd:doc>
  <xsl:function name="hcmc:getRangeLabel" as="xs:string">
    <xsl:param name="strRange" as="xs:string"/>
    <xsl:param name="durRange" as="xs:duration"/>
    <xsl:choose>
      <xsl:when test="xs:yearMonthDuration($durRange) gt xs:yearMonthDuration('P1Y')">
        <xsl:sequence select="replace($strRange, '^(\d\d\d\d)[^/]+/(\d\d\d\d).+$', '$1 - $2')"/>
      </xsl:when>
      <xsl:when test="xs:yearMonthDuration($durRange) gt xs:yearMonthDuration('P1M')">
        <xsl:sequence select="replace($strRange, '^(\d\d\d\d).+$', '$1')"/>
      </xsl:when>
      <xsl:when test="xs:yearMonthDuration($durRange) eq xs:yearMonthDuration('P1M')">
        <xsl:sequence select="replace($strRange, '^(\d\d\d\d-\d\d).+$', '$1')"/>
      </xsl:when>
      <xsl:when test="xs:dayTimeDuration($durRange) gt xs:dayTimeDuration('P0DT1H')">
        <xsl:sequence select="replace($strRange, '^(\d\d\d\d-\d\d-\d\d).+$', '$1')"/>
      </xsl:when>
      <xsl:when test="xs:dayTimeDuration($durRange) gt xs:dayTimeDuration('P0DT1M')">
        <xsl:variable name="dt" select="xs:dateTime(substring-before($strRange, '/'))"/>
        <xsl:sequence select="format-dateTime($dt, '[MNn] [D1o], [H01]:00 - [H01]:59')"/>
      </xsl:when>
      <xsl:otherwise><xsl:sequence select="'Error: unprocessable dateTime range.'"/></xsl:otherwise>
    </xsl:choose>
  </xsl:function>
  
  <xd:doc>
    <xd:desc><xd:ref type="function" name="hcmc:getTimelinePoints" as="xs:string*">hcmc:getTimelinePoints</xd:ref>
    receives a pair of points in time, calculates the duration between them, and then constructs a map of optimum
    points to form the divisions of a timeline, returning these as datetime strings in ISO 8601 format.</xd:desc>
    <xd:param name="start" as="xs:string">The starting point.</xd:param>
    <xd:param name="end" as="xs:string">The ending point.</xd:param>
    <xd:param name="maxPointCount" as="xs:integer">The maximum number of points to be returned.</xd:param>
  </xd:doc>
  <xsl:function name="hcmc:getTimelinePoints" as="xs:string*">
    <xsl:param name="start" as="xs:string"/>
    <xsl:param name="end" as="xs:string"/>
    <xsl:param name="maxPointCount" as="xs:integer"/>
    
    <!-- First, expand the inputs to get full dateTimes. -->
    <xsl:variable name="dStart" as="xs:dateTime" select="hcmc:expandDateTime($start, true())"/>
    <xsl:variable name="dEnd" as="xs:dateTime" select="hcmc:expandDateTime($end, false())"/>
    
    <!-- Next, get the duration between the two date-times. -->
    <xsl:variable name="dtRangeDayTime" as="xs:dayTimeDuration" select="$dEnd - $dStart"/>
    
    <xsl:variable name="strStartFull" as="xs:string" select="format-dateTime($dStart, $dtPictureString)"/>

    <!-- Now figure out the optimum unit to use. We'll assume hours are the minimum. -->
    <!-- TODO: CONTINUE THIS. -->
    <xsl:choose>
      <xsl:when test="($dtRangeDayTime div (xs:dayTimeDuration('P0DT1H'))) lt $maxPointCount and ($dtRangeDayTime div (xs:dayTimeDuration('P0DT1H'))) gt 0">
        <!--<xsl:sequence select="'hours'"/>-->
        <!-- It's hours. -->
        <xsl:variable name="tlStart" as="xs:dateTime" select="hcmc:roundDownDateTime($dStart, 'P1H')"/>
        <xsl:sequence select="hcmc:getTimelineAsStrings((), $tlStart, xs:dayTimeDuration('P0DT1H'), $dEnd)"/>
      </xsl:when>
      <xsl:when test="($dtRangeDayTime div (xs:dayTimeDuration('P1D'))) lt $maxPointCount and ($dtRangeDayTime div (xs:dayTimeDuration('P1D'))) gt 0">
        <!-- It's days. -->
        <xsl:variable name="tlStart" as="xs:dateTime" select="hcmc:roundDownDateTime($dStart, 'P1D')"/>
        <xsl:sequence select="hcmc:getTimelineAsStrings((), $tlStart, xs:dayTimeDuration('P1D'), $dEnd)"/>
      </xsl:when>
      <xsl:when test="($dtRangeDayTime div (xs:dayTimeDuration('P30D'))) lt $maxPointCount and ($dtRangeDayTime div (xs:dayTimeDuration('P30D'))) gt 0">
        <!-- It's months. -->
        <xsl:variable name="tlStart" as="xs:dateTime" select="hcmc:roundDownDateTime($dStart, 'P1M')"/>
        <xsl:sequence select="hcmc:getTimelineAsStrings((), $tlStart, xs:yearMonthDuration('P1M'), $dEnd)"/>
      </xsl:when>
      <xsl:when test="($dtRangeDayTime div (xs:dayTimeDuration('P365D'))) lt $maxPointCount and ($dtRangeDayTime div (xs:dayTimeDuration('P365D'))) gt 0">
        <!-- It's years. -->
        <xsl:variable name="tlStart" as="xs:dateTime" select="hcmc:roundDownDateTime($dStart, 'P1Y')"/>
        <xsl:sequence select="hcmc:getTimelineAsStrings((), $tlStart, xs:yearMonthDuration('P1Y'), $dEnd)"/>
      </xsl:when>
      <xsl:when test="($dtRangeDayTime div (xs:dayTimeDuration('P1826D'))) lt $maxPointCount and ($dtRangeDayTime div (xs:dayTimeDuration('P1826D'))) gt 0">
        <!-- It's 5-year blocks. -->
        <xsl:variable name="tlStart" as="xs:dateTime" select="hcmc:roundDownDateTime($dStart, 'P5Y')"/>
        <xsl:sequence select="hcmc:getTimelineAsStrings((), $tlStart, xs:yearMonthDuration('P5Y'), $dEnd)"/>
      </xsl:when>
      <xsl:when test="($dtRangeDayTime div (xs:dayTimeDuration('P3652D'))) lt $maxPointCount and ($dtRangeDayTime div (xs:dayTimeDuration('P3652D'))) gt 0">
        <!-- It's decades. -->
        <xsl:variable name="tlStart" as="xs:dateTime" select="hcmc:roundDownDateTime($dStart, 'P10Y')"/>
        <xsl:sequence select="hcmc:getTimelineAsStrings((), $tlStart, xs:yearMonthDuration('P10Y'), $dEnd)"/>
      </xsl:when>
      <xsl:when test="($dtRangeDayTime div (xs:dayTimeDuration('P9132D'))) lt $maxPointCount and ($dtRangeDayTime div (xs:dayTimeDuration('P9132D'))) gt 0">
        <!-- It's 25-year blocks. -->
        <xsl:variable name="tlStart" as="xs:dateTime" select="hcmc:roundDownDateTime($dStart, 'P25Y')"/>
        <xsl:sequence select="hcmc:getTimelineAsStrings((), $tlStart, xs:yearMonthDuration('P25Y'), $dEnd)"/>
      </xsl:when>
      <xsl:when test="($dtRangeDayTime div (xs:dayTimeDuration('P36600D'))) lt $maxPointCount and ($dtRangeDayTime div (xs:dayTimeDuration('P36600D'))) gt 0">
        <!-- It's centuries. -->
        <xsl:variable name="tlStart" as="xs:dateTime" select="hcmc:roundDownDateTime($dStart, 'P100Y')"/>
        <xsl:sequence select="hcmc:getTimelineAsStrings((), $tlStart, xs:yearMonthDuration('P100Y'), $dEnd)"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:sequence select="'Unable to calculate timeline granularity.'"/>
      </xsl:otherwise>
    </xsl:choose>
    
  </xsl:function>
  
  <xd:doc>
    <xd:desc><xd:ref name="hcmc:roundDownDateTime">hcmc:roundDownDateTime</xd:ref> rounds a datetime
    down or up to a particular anchor value based on a fixed period. </xd:desc>
    <xd:param name="dt" as="xs:dateTime">The incoming dateTime.</xd:param>
    <xd:param name="granularity" as="xs:string">The period to be rounded to, in a string as
      used by xs:duration constructors.</xd:param>
    <xd:return>An xs:dateTime for the rounded value.</xd:return>
  </xd:doc>
  <xsl:function name="hcmc:roundDownDateTime" as="xs:dateTime*">
    <xsl:param name="dt" as="xs:dateTime"/>
    <xsl:param name="granularity" as="xs:string"/>
    <xsl:variable name="strDt" as="xs:string" select="format-dateTime($dt, $dtPictureString)"/>
    <xsl:variable name="strDate" as="xs:string" select="substring-before($strDt, 'T')"/>
    <xsl:variable name="strTime" as="xs:string" select="substring-after($strDt, 'T')"/>
    
    <!--<xsl:message select="'$strDate = ' || $strDate"/> 
    <xsl:message select="'$strTime = ' || $strTime"/>-->
    <!--<xsl:variable name="durSinceYearZero" as="xs:duration" select="$dt - xs:dateTime('0000-01-01T00:00:00')"/>-->
    <!-- We have to fork based on whether we're using yearMonth or dayTime durations, because 
         the operators are constrained to apply specifically to pairs of matching types. -->
    <!--<xsl:message select="'contains($granularity, ''H'') ' || contains($granularity, 'H')"/>-->
<!--    
    <xsl:sequence select="xs:dateTime('2020-01-01T12:12:12')"/>
    -->
    <xsl:choose>
      <xsl:when test="contains($granularity, 'H')">
        <!-- It's hours. -->
        <xsl:sequence select="dateTime(xs:date($strDate), xs:time(replace($strTime, ':\d\d:\d\d$', ':00:00')))"/>
      </xsl:when>
      <xsl:when test="contains($granularity, 'D')">
        <!-- It's hours. -->
        <xsl:sequence select="dateTime(xs:date($strDate), xs:time('00:00:00'))"/>
      </xsl:when>
      <xsl:when test="contains($granularity, 'M')">
        <!-- It's months. -->
        <xsl:sequence select="dateTime(xs:date(replace($strDate, '-\d\d$', '-01')), xs:time('00:00:00'))"/>
      </xsl:when>
      <xsl:when test="contains($granularity, '1Y')">
        <!-- It's years. -->
        <xsl:sequence select="dateTime(xs:date(replace($strDate, '-\d\d-\d\d$', '-01-01')), xs:time('00:00:00'))"/>
      </xsl:when>
      <xsl:when test="matches($granularity, '^P\d+')">
        <!-- It's blocks of 5, 10, 25 or 100 years. -->
        <xsl:variable name="intYear" as="xs:integer" select="xs:integer(substring($strDt, 1, 4))"/>
        <xsl:variable name="strDurYears" select="replace($granularity, 'P(\d+)Y', '$1')"/>
        <xsl:variable name="intGran" as="xs:integer" select="xs:integer($strDurYears)"/>
        <xsl:variable name="intRoundedYear" as="xs:integer" select="$intYear - ($intYear mod $intGran)"/>
        <xsl:sequence select="dateTime(xs:date(xs:string($intRoundedYear) || '-01-01'), xs:time('00:00:00'))"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:message terminate="yes" select="$granularity || ' is not a viable granularity for the timeline.'"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:function>
  
  <xd:doc>
    <xd:desc><xd:ref type="function" name="hcmc:getFeatureIdsForTimelinePoint">hcmc:getFeatureIdsForTimelinePoint</xd:ref>
    is passed a timeline point and retrieves the ids of all features which have a dateTime range which overlaps with
    the point. This is used to construct a richer timeline structure which obviates the need to check through all 
    features in the JavaScript to look for time matches every time the timeline moves.</xd:desc>
    <xd:param name="timelinePoint" as="xs:string">A timeline point in the form of a slash-delimited range.</xd:param>
    <xd:param name="places" as="element(place)*">A sequence of zero or more TEI place elements which may or may not 
    have timing information in the form of date elements in its location/desc.</xd:param>
    <xd:return>A sequence of feature ids.</xd:return>
  </xd:doc>
  <xsl:function name="hcmc:getFeatureIdsForTimelinePoint" as="xs:string*">
    <xsl:param name="timelinePoint" as="xs:string"/>
    <xsl:param name="places" as="element(place)*"/>
    
    
  </xsl:function>
  
  <xd:doc>
    <xd:desc><xd:ref type="function" name="hcmc:expandDateTime" as="xs:string*">hcmc:expandDateTime</xd:ref>
      receives a date or datetime string and expands it to a complete datetime
    which can be converted into an xs:dateTime, then returns the xs:dateTime.
    </xd:desc>
    <xd:param name="strDateTime" as="xs:string">The possibly-incomplete datetime.</xd:param>
    <xd:param name="boolRoundDown" as="xs:boolean">Whether to round down to the beginning
      of the period or up to the end of the period.</xd:param>
  </xd:doc>
  <xsl:function name="hcmc:expandDateTime" as="xs:dateTime">
    <xsl:param name="strDateTime" as="xs:string"/>
    <xsl:param name="boolRoundDown" as="xs:boolean"/>
    <xsl:choose>
      <xsl:when test="$boolRoundDown">
        <xsl:choose>
          <xsl:when test="matches($strDateTime, '^\d\d\d\d$')">
            <xsl:sequence select="xs:dateTime($strDateTime || '-01-01T00:00:00')"/>
          </xsl:when>
          <xsl:when test="matches($strDateTime, '^\d\d\d\d-\d\d$')">
            <xsl:sequence select="xs:dateTime($strDateTime || '-01T00:00:00')"/>
          </xsl:when>
          <xsl:when test="matches($strDateTime, '^\d\d\d\d-\d\d-\d\d$')">
            <xsl:sequence select="xs:dateTime($strDateTime || 'T00:00:00')"/>
          </xsl:when>
          <xsl:when test="matches($strDateTime, '^\d\d\d\d-\d\d-\d\dT\d\d$')">
            <xsl:sequence select="xs:dateTime($strDateTime || ':00:00')"/>
          </xsl:when>
          <xsl:when test="matches($strDateTime, '^\d\d\d\d-\d\d-\d\dT\d\d:\d\d$')">
            <xsl:sequence select="xs:dateTime($strDateTime || ':00')"/>
          </xsl:when>
          <xsl:when test="matches($strDateTime, '^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d$')">
            <xsl:sequence select="xs:dateTime($strDateTime)"/>
          </xsl:when>
          <xsl:otherwise>
            <xsl:message terminate="yes" select="$strDateTime || ' is not a valid date/time value.'"/>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:when>
      <xsl:otherwise>
        <xsl:choose>
          <xsl:when test="matches($strDateTime, '^\d\d\d\d$')">
            <xsl:sequence select="xs:dateTime($strDateTime || '-12-31T23:59:59')"/>
          </xsl:when>
          <xsl:when test="matches($strDateTime, '^\d\d\d\d-((01)|(03)|(05)|(07)|(08)|(10)|(12))$')">
            <xsl:sequence select="xs:dateTime($strDateTime || '-31T23:59:59')"/>
          </xsl:when>
          <xsl:when test="matches($strDateTime, '^\d\d\d\d-((04)|(06)|(09)|(11))$')">
            <xsl:sequence select="xs:dateTime($strDateTime || '-30T23:59:59')"/>
          </xsl:when>
          <xsl:when test="matches($strDateTime, '^\d\d\d\d-02$')">
            <xsl:sequence select="xs:dateTime($strDateTime || '-28T23:59:59')"/>
          </xsl:when>
          <xsl:when test="matches($strDateTime, '^\d\d\d\d-\d\d-\d\d$')">
            <xsl:sequence select="xs:dateTime($strDateTime || 'T23:59:59')"/>
          </xsl:when>
          <xsl:when test="matches($strDateTime, '^\d\d\d\d-\d\d-\d\dT\d\d$')">
            <xsl:sequence select="xs:dateTime($strDateTime || ':59:59')"/>
          </xsl:when>
          <xsl:when test="matches($strDateTime, '^\d\d\d\d-\d\d-\d\dT\d\d:\d\d$')">
            <xsl:sequence select="xs:dateTime($strDateTime || ':59')"/>
          </xsl:when>
          <xsl:when test="matches($strDateTime, '^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d$')">
            <xsl:sequence select="xs:dateTime($strDateTime)"/>
          </xsl:when>
          <xsl:otherwise>
            <xsl:message terminate="yes" select="$strDateTime || ' is not a valid date/time value.'"/>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:function>
  
</xsl:stylesheet>
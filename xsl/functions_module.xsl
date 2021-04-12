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
    <xd:desc><xd:ref name="selfClosingXhtmlElements" type="variable">selfClosingXhtmlElements</xd:ref>
    is a sequence of strings representing element names which should be rendered as self-closing.</xd:desc>
  </xd:doc>
  <xsl:variable name="selfClosingXhtmlElements" select="('area', 'base', 'head', 'br', 'col', 'colgroup', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'video', 'audio', 'wbr')"/>
  
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
    <xsl:variable name="dtRange" as="xs:duration" select="$dEnd - $dStart"/>
    
    <!-- Now figure out the optimum unit to use. We'll assume hours are the minimum. -->
    <!-- TODO: CONTINUE THIS. -->
    <xsl:choose>
      <xsl:when test="($dtRange div (xs:duration('P0DT1H'))) lt $maxPointCount">
        <!-- It's hours. -->
      </xsl:when>
      <xsl:when test="($dtRange div (xs:duration('P1D'))) lt $maxPointCount">
        <!-- It's days. -->
      </xsl:when>
      <xsl:when test="($dtRange div (xs:duration('P1M'))) lt $maxPointCount">
        <!-- It's months. -->
      </xsl:when>
      <xsl:when test="($dtRange div (xs:duration('P1Y'))) lt $maxPointCount">
        <!-- It's years. -->
      </xsl:when>
      <xsl:when test="($dtRange div (xs:duration('P5Y'))) lt $maxPointCount">
        <!-- It's 5-year blocks. -->
      </xsl:when>
      <xsl:when test="($dtRange div (xs:duration('P10Y'))) lt $maxPointCount">
        <!-- It's decades. -->
      </xsl:when>
      <xsl:when test="($dtRange div (xs:duration('P25Y'))) lt $maxPointCount">
        <!-- It's quarter-centuries. -->
      </xsl:when>
      <xsl:when test="($dtRange div (xs:duration('P100Y'))) lt $maxPointCount">
        <!-- It's centuries. -->
      </xsl:when>
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
    <xsl:variable name="dtPictureString" as="xs:string">[Y0001]-[M01]-[D01]T[H01]:[m01]:[s01]</xsl:variable>
    <xsl:variable name="strDt" as="xs:string" select="format-dateTime($dt, $dtPictureString)"/>
    <xsl:variable name="strDate" as="xs:string" select="substring-before($strDt, 'T')"/>
    <xsl:variable name="strTime" as="xs:string" select="substring-after($strDt, 'T')"/>
    
    <xsl:message select="'$strDate = ' || $strDate"/> 
    <xsl:message select="'$strTime = ' || $strTime"/>
    <!--<xsl:variable name="durSinceYearZero" as="xs:duration" select="$dt - xs:dateTime('0000-01-01T00:00:00')"/>-->
    <!-- We have to fork based on whether we're using yearMonth or dayTime durations, because 
         the operators are constrained to apply specifically to pairs of matching types. -->
    <xsl:message select="'contains($granularity, ''H'') ' || contains($granularity, 'H')"/>
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
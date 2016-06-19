<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:xd="http://www.oxygenxml.com/ns/doc/xsl"
    xmlns:hcmc="http://hcmc.uvic.ca/ns"
    xmlns="http://www.tei-c.org/ns/1.0"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    version="1.0">
    <xd:doc scope="stylesheet">
        <xd:desc>
            <xd:p><xd:b>Created on:</xd:b> May 20, 2016</xd:p>
            <xd:p><xd:b>Author:</xd:b> mholmes</xd:p>
          <xd:p>NOTE: THIS IS UNFINISHED.  THE CORRESPONDING XSLT2 FILE HAS BEEN UPDATED
                TO HANDLE GeometryCollections, but this one has not.</xd:p>
            <xd:p>The purpose of this stylesheet is to process a single 
            TEI file, conforming to a specific highly-constrained schema,
            into two JSON files, one for categories and one GeoJSON for
            features.</xd:p>
        </xd:desc>
    </xd:doc>
    
    
    <xsl:output method="text" encoding="UTF-8" indent="no" xml:space="default"/>
  
    <xsl:strip-space elements="*"/>
    
    <xsl:variable name="root" select="/"/>
    <xsl:variable name="quot">"</xsl:variable>

  
    <xsl:template match="/">
      
<!--      Create the GeoJSON. -->
        <xsl:text>{ "type": "FeatureCollection",</xsl:text>
        <xsl:text>&#x0a;  "features": [&#x0a;</xsl:text>
<!--        NOTE:  We have to handle multi-geometries here as well. -->
      <xsl:variable name="places" select="//tei:text/tei:body/descendant::tei:place[tei:location[not(tei:geo[@n])]]"/>
        <xsl:for-each select="$places">
          <xsl:variable name="thisPlace" select="."/>
          <xsl:text>  { "type": "Feature",&#x0a;</xsl:text>
          <xsl:text>      "id": "</xsl:text><xsl:value-of select="$thisPlace/@xml:id"/><xsl:text>", &#x0a;</xsl:text>
          <xsl:text>      "geometry": {&#x0a;</xsl:text>
          <xsl:text>        "type": "</xsl:text><xsl:value-of select="tei:location/@type"/><xsl:text>", &#x0a;</xsl:text>
          <xsl:text>        "coordinates": </xsl:text><xsl:value-of select="tei:location/tei:geo"/>
          <xsl:text>&#x0a;        }, &#x0a;      "properties": {&#x0a;</xsl:text>
          
<!--  GET ALL THE PROPERTIES HERE.        -->
          
          <xsl:text>        "name": "</xsl:text><xsl:variable name="escapedPlaceName"><xsl:call-template name="escapeForJSON"><xsl:with-param name="inStr" select="$thisPlace/tei:placeName"/></xsl:call-template></xsl:variable><xsl:value-of select="$escapedPlaceName"/><xsl:text>", &#x0a;</xsl:text>
          <xsl:variable name="escapedPlaceDesc"><xsl:call-template name="escapeForJSON"><xsl:with-param name="inStr" select="$thisPlace/tei:desc[1]"/></xsl:call-template></xsl:variable>
          <xsl:text>        "desc": "</xsl:text><xsl:value-of select="$escapedPlaceDesc"/><xsl:text>", &#x0a;</xsl:text>
          <xsl:text>        "links": [</xsl:text>
          <xsl:for-each select="$thisPlace/tei:desc[2]/tei:list/tei:item/tei:ptr">
            <xsl:value-of select="concat($quot, @target, $quot)"/><xsl:if test="position() &lt; last()"><xsl:text>,</xsl:text></xsl:if>
          </xsl:for-each>
          <xsl:text>], &#x0a;</xsl:text>

          <xsl:variable name="thisFeatureCatsString" select="concat('|', translate(normalize-space($thisPlace/@corresp), ' #', '|'), '|')"/>
          <xsl:message>'<xsl:value-of select="$thisPlace/@corresp"/>' tokenized to: <xsl:value-of select="$thisFeatureCatsString"/>. </xsl:message>
          
          
          <xsl:variable name="thisFeatureTaxonomies" select="$root//tei:taxonomy[child::tei:category[contains($thisFeatureCatsString, concat('|', @xml:id, '|'))]]"/>
          <xsl:text>        "taxonomies": [</xsl:text>
            <xsl:for-each select="$thisFeatureTaxonomies">
              <xsl:text>&#x0a;          {"id": "</xsl:text><xsl:value-of select="@xml:id"/><xsl:text>",</xsl:text>
              <xsl:text>&#x0a;          "name": "</xsl:text><xsl:value-of select="@n"/><xsl:text>",</xsl:text>
              <xsl:text>&#x0a;           "pos": </xsl:text><xsl:value-of select="count(preceding-sibling::tei:taxonomy) + 1"/><xsl:text>,</xsl:text>
              <xsl:text>&#x0a;           "categories": [</xsl:text>
              <xsl:variable name="thisTaxCatsForThisFeat" select="child::tei:category[contains($thisFeatureCatsString, concat('|', @xml:id, '|'))]"/>
              <xsl:for-each select="$thisTaxCatsForThisFeat">
                <xsl:text>{"id": </xsl:text><xsl:value-of select="concat($quot, @xml:id, $quot)"/>
                <xsl:variable name="escapedCatName"><xsl:call-template name="escapeForJSON"><xsl:with-param name="inStr" select="tei:gloss"/></xsl:call-template></xsl:variable>
                <xsl:text>, "name": </xsl:text><xsl:value-of select="concat($quot, $escapedCatName, $quot)"/>
                <xsl:text>, "pos": </xsl:text><xsl:value-of select="count(preceding-sibling::tei:category) + 1"/><xsl:text>}</xsl:text>
                <xsl:if test="position() &lt; last()"><xsl:text>,</xsl:text></xsl:if>
              </xsl:for-each>
              <xsl:text>]}</xsl:text><xsl:if test="position() &lt; last()"><xsl:text>,</xsl:text></xsl:if>
            </xsl:for-each>
          <xsl:text>]</xsl:text>
          <xsl:text>&#x0a;      }</xsl:text>
          <xsl:text>&#x0a;    }</xsl:text>
          <xsl:if test="position() &lt; last()"><xsl:text>,&#x0a;  </xsl:text></xsl:if>
        </xsl:for-each>
        <xsl:text>&#x0a;  ]&#x0a;}</xsl:text>
      
    </xsl:template>
    
<!--  Adapted with thanks from here:
      http://www.heber.it/?p=1088  -->
    
  <xsl:template name="tokenizeStringRemoveHashes">
    <!--passed template parameter -->
    <xsl:param name="list"/>
    <xsl:param name="delimiter"/>
    <xsl:choose>
      <xsl:when test="contains($list, $delimiter)">               
          <!-- get everything in front of the first delimiter --><xsl:value-of select="substring-after(substring-before($list,$delimiter), '#')"/>
        <xsl:call-template name="tokenizeStringRemoveHashes">
          <!-- store anything left in another variable -->
          <xsl:with-param name="list" select="substring-after($list,$delimiter)"/>
          <xsl:with-param name="delimiter" select="$delimiter"/>
        </xsl:call-template>
      </xsl:when>
      <xsl:otherwise>
        <xsl:choose>
          <xsl:when test="$list = ''">
            <xsl:text/>
          </xsl:when>
          <xsl:otherwise>
            <xsl:value-of select="substring-after($list, '#')"/>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>  
  
    <xsl:template name="escapeForJSON">
      <xsl:param name="inStr"/>
      <xsl:choose>
        <xsl:when test="contains($inStr, $quot)"><xsl:value-of select="substring-before($inStr, $quot)"/><xsl:text>\&quot;</xsl:text><xsl:call-template name="escapeForJSON"><xsl:with-param name="inStr" select="substring-after($inStr, $quot)"/></xsl:call-template></xsl:when>
        <xsl:when test="$inStr = ''"><xsl:text/></xsl:when>
        <xsl:otherwise><xsl:value-of select="$inStr"/></xsl:otherwise>
      </xsl:choose>
    </xsl:template>
  
  <!--<xsl:function name="hcmc:escapeForJSON" as="xs:string">
    <xsl:param name="inStr" as="xs:string"/>
    <xsl:value-of select="replace(normalize-space($inStr), '&quot;', '\\&quot;')"/> 
  </xsl:function>-->
    
</xsl:stylesheet>
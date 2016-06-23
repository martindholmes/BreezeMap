<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:xd="http://www.oxygenxml.com/ns/doc/xsl"
    exclude-result-prefixes="#all"
    xmlns:hcmc="http://hcmc.uvic.ca/ns"
    xmlns="http://www.tei-c.org/ns/1.0"
    xpath-default-namespace="http://www.tei-c.org/ns/1.0"
    version="2.0">
    <xd:doc scope="stylesheet">
        <xd:desc>
            <xd:p><xd:b>Created on:</xd:b> May 20, 2016</xd:p>
            <xd:p><xd:b>Author:</xd:b> mholmes</xd:p>
            <xd:p>The purpose of this stylesheet is to process a single 
            TEI file, conforming to a specific highly-constrained schema,
            into two JSON files, one for categories and one GeoJSON for
            features.</xd:p>
        </xd:desc>
    </xd:doc>
    
    
    <xsl:output method="text" encoding="UTF-8" normalization-form="NFC" name="json" indent="no" xml:space="default"/>
  
    <xsl:strip-space elements="*"/>
    
    <xsl:variable name="root" select="/"/>
    <xsl:variable name="quot">"</xsl:variable>
    <xsl:variable name="outputPath" select="concat('../js/', tokenize(replace(document-uri($root), '\.xml$', ''), '/')[last()], '.json')"/>
    <xsl:variable name="catsOutputPath" select="concat('../js/', tokenize(replace(document-uri($root), '\.xml$', ''), '/')[last()], '_categories.json')"/>

  
    <xsl:template match="/">

<!--      Now the GeoJSON. -->
      <xsl:result-document href="{$outputPath}" format="json">
        <xsl:text>{ "type": "FeatureCollection",</xsl:text>
        <xsl:text>&#x0a;  "features": [&#x0a;</xsl:text>
        
        <xsl:variable name="places" select="//text/body/descendant::place[location]"/>
        
<!-- Now we do the default base feature which constitutes the map, and which is never shown. -->
        <xsl:if test="$places[@xml:id='holMap']">
          <xsl:text>  { "type": "Feature",&#x0a;</xsl:text>
          <xsl:text>      "id": "map", &#x0a;</xsl:text>
          <xsl:text>      "geometry": {&#x0a;</xsl:text>
          <xsl:text>        "type": "Polygon", &#x0a;</xsl:text>
          <xsl:text>        "coordinates": </xsl:text><xsl:text>[]</xsl:text>
          <xsl:text>&#x0a;          }</xsl:text><xsl:if test="$places[@xml:id != 'holMap']"><xsl:text>, </xsl:text>
        </xsl:if>
        <xsl:for-each select="$places">
          <xsl:variable name="thisPlace" select="."/>
          <xsl:text>  { "type": "Feature",&#x0a;</xsl:text>
          <xsl:text>      "id": "</xsl:text><xsl:value-of select="$thisPlace/@xml:id"/><xsl:text>", &#x0a;</xsl:text>
          <xsl:text>      "geometry": {&#x0a;</xsl:text>
          <xsl:text>        "type": "</xsl:text><xsl:value-of select="location/@type"/><xsl:text>", &#x0a;</xsl:text>
          
          <xsl:choose>
            <xsl:when test="location/@type = 'GeometryCollection'">
              <xsl:text>        "geometries": [&#x0a;</xsl:text>
                <xsl:for-each select="location/geo">
                  <xsl:text>          {&#x0a;</xsl:text>
                  <xsl:text>            "type": "</xsl:text><xsl:value-of select="@n"/><xsl:text>", &#x0a;</xsl:text>
                  <xsl:text>            "coordinates": </xsl:text><xsl:value-of select="."/>
                  <xsl:text>&#x0a;          }</xsl:text><xsl:if test="position() lt last()"><xsl:text>, </xsl:text></xsl:if>
                  <xsl:text>&#x0a;</xsl:text>
                </xsl:for-each>
              <xsl:text>        ]</xsl:text>
            </xsl:when>
            <xsl:otherwise>
              <xsl:text>        "coordinates": </xsl:text><xsl:value-of select="location/geo"/>
            </xsl:otherwise>
          </xsl:choose>
          <xsl:text>&#x0a;      }, &#x0a;      "properties": {&#x0a;</xsl:text>
          
<!--  GET ALL THE PROPERTIES HERE.        -->
          
          <xsl:text>        "name": "</xsl:text><xsl:value-of select="hcmc:escapeForJSON($thisPlace/placeName)"/><xsl:text>", &#x0a;</xsl:text>
          
          <xsl:text>        "desc": "</xsl:text><xsl:value-of select="hcmc:escapeForJSON($thisPlace/desc[1])"/><xsl:text>", &#x0a;</xsl:text>
          <xsl:text>        "links": [</xsl:text>
          <xsl:for-each select="$thisPlace/desc[2]/list/item/ptr">
            <xsl:value-of select="concat($quot, @target, $quot, if (position() lt last()) then ', ' else '')"/>
          </xsl:for-each>
          <xsl:text>], &#x0a;</xsl:text>

          
<!--  Now taxonomies and categories.        -->
          <xsl:variable name="thisFeatureCategories" select="for $c in distinct-values(($thisPlace/@corresp/tokenize(., '\s+'))) return substring-after($c, '#')"/>
          <xsl:variable name="thisFeatureTaxonomies" select="$root//taxonomy[child::category[@xml:id=$thisFeatureCategories]]"/>
          <xsl:text>        "taxonomies": [</xsl:text>
            <xsl:for-each select="$thisFeatureTaxonomies">
              <xsl:text>&#x0a;          {"id": "</xsl:text><xsl:value-of select="@xml:id"/><xsl:text>",</xsl:text>
              <xsl:text>&#x0a;          "name": "</xsl:text><xsl:value-of select="@n"/><xsl:text>",</xsl:text>
              <xsl:text>&#x0a;           "pos": </xsl:text><xsl:value-of select="count(preceding-sibling::taxonomy) + 1"/><xsl:text>,</xsl:text>
              <xsl:text>&#x0a;           "categories": [</xsl:text>
              <xsl:variable name="thisTaxCatsForThisFeat" select="child::category[@xml:id=$thisFeatureCategories]"/>
              <xsl:for-each select="$thisTaxCatsForThisFeat">
                <xsl:text>{"id": </xsl:text><xsl:value-of select="concat($quot, @xml:id, $quot)"/>
                <xsl:text>, "name": </xsl:text><xsl:value-of select="concat($quot, hcmc:escapeForJSON(gloss), $quot)"/>
                <xsl:text>, "pos": </xsl:text><xsl:value-of select="count(preceding-sibling::category) + 1"/><xsl:text>}</xsl:text>
                <xsl:if test="position() lt last()"><xsl:text>,</xsl:text></xsl:if>
              </xsl:for-each>
              <xsl:text>]}</xsl:text><xsl:if test="position() lt last()"><xsl:text>,</xsl:text></xsl:if>
            </xsl:for-each>
          <xsl:text>]</xsl:text>
          <xsl:text>&#x0a;      }</xsl:text>
          <xsl:text>&#x0a;    }</xsl:text>
          <xsl:if test="position() lt last()"><xsl:text>,&#x0a;  </xsl:text></xsl:if>
        </xsl:for-each>
        <xsl:text>&#x0a;  ]&#x0a;}</xsl:text>
      </xsl:result-document>
    </xsl:template>
    
  
  <xsl:function name="hcmc:escapeForJSON" as="xs:string">
    <xsl:param name="inNode" as="node()*"/>
<!--   First, we have to process all the elements into plain text. -->
    <xsl:variable name="convertedFrag"><xsl:apply-templates mode="serializedXhtml" select="$inNode"/></xsl:variable>
    <xsl:value-of select="replace(normalize-space($convertedFrag), '&quot;', '\\&quot;')"/> 
  </xsl:function>
  
  <xsl:template match="title[@level='m' or @level='j']" mode="serializedXhtml">
    &lt;em&gt;<xsl:apply-templates mode="#current"/>&lt;/em&gt;
  </xsl:template>
  
  <xsl:template match="title[@level='a'] | q" mode="serializedXhtml">
    &lt;q&gt;<xsl:apply-templates mode="#current"/>&lt;/q&gt;
  </xsl:template>
  
  <xsl:template match="ref[@target]" mode="serializedXhtml">
    &lt;a href="<xsl:value-of select="@target"/>"&gt;<xsl:apply-templates mode="#current"/>&lt;/a&gt;
  </xsl:template>
    
</xsl:stylesheet>
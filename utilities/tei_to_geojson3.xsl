<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:xd="http://www.oxygenxml.com/ns/doc/xsl"
    exclude-result-prefixes="#all"
    xmlns:hcmc="http://hcmc.uvic.ca/ns"
    xmlns="http://www.tei-c.org/ns/1.0"
    xpath-default-namespace="http://www.tei-c.org/ns/1.0"
    xmlns:fn="http://www.w3.org/2005/xpath-functions"
    version="3.0">
    <xd:doc scope="stylesheet">
        <xd:desc>
            <xd:p><xd:b>Created in:</xd:b> March 2018.</xd:p>
            <xd:p><xd:b>Author:</xd:b> mholmes</xd:p>
            <xd:p>The purpose of this stylesheet is to process a single 
            TEI file, conforming to a specific highly-constrained schema,
            into a single GeoJSON file. This is an XSLT 3 rewrite of the 
            original XSLT 2 version, taking advantage of the new JSON 
            features available in XSLT 3.</xd:p>
        </xd:desc>
    </xd:doc>
    
    
  <xsl:output method="text" encoding="UTF-8" exclude-result-prefixes="#all"
    normalization-form="NFC" media-type="text/json"  />
  
    <xsl:strip-space elements="*"/>
    
    <xsl:variable name="root" select="/"/>
    <xsl:variable name="quot">"</xsl:variable>
    <xsl:param name="outputPath" select="concat('../js/', tokenize(replace(document-uri($root), '\.xml$', ''), '/')[last()], '.json')"/>
  
    <xsl:template match="/">
      <xsl:variable name="jsonXml">
        <map xmlns="http://www.w3.org/2005/xpath-functions">
          <string key="type">FeatureCollection</string>
          <array key="features">
            <xsl:variable name="places" select="//text/body/descendant::place[location]"/>
<!-- Now we do the default base feature which constitutes the map, and which is never shown.
     It includes a complete copy of the taxonomies, as well as the coordinates of the map
     starting position. -->
              <map>
                <string key="type">Feature</string>
                <string key="id">holMap</string>
<!-- Rather oddly, our data in the XML file at this point is in GeoJSON, so we have to 
     convert it to XML to insert it into this structure; later it will be converted back. -->
                <xsl:variable name="gjGeometry" as="xs:string" 
                  select="concat('{', $places[@xml:id='holMap']/location[@type='GeoJSON'][1]/geo[1], '}')"/>
                <xsl:variable name="gjGeomObj" select="json-to-xml($gjGeometry)"/>
                <xsl:sequence select="$gjGeomObj/*:map/*"/>
                <map key="properties">
<!-- This base feature gets a copy of all the taxonomies and categories. -->
                  <string key="name">holMap</string>
                  <array key="taxonomies">
                    <xsl:for-each select="$root//taxonomy">
                      <string key="id"><xsl:value-of select="@xml:id"/></string>
                      <string key="name"><xsl:value-of select="@n"/></string>
                      <number key="pos"><xsl:value-of select="count(preceding-sibling::taxonomy) + 1"/></number>
                      <array key="taxonomies">
                        <xsl:for-each select="child::category">
                          <string key="id"><xsl:value-of select="@xml:id"/></string>
                          <string key="name"><xsl:apply-templates select="gloss" mode="xhtml5"/></string>
                          <xsl:if test="desc">
                            <string key="desc"><xsl:apply-templates select="desc" mode="xhtml5"/></string>
                          </xsl:if>
                          <number key="pos"><xsl:value-of select="count(preceding-sibling::category) + 1"/></number>
                        </xsl:for-each>
                      </array>
                    </xsl:for-each>
                  </array>
                </map>
              </map>
              <xsl:for-each select="$places[@xml:id != 'holMap']">
                <xsl:variable name="thisPlace" select="."/>
                <map>
                  <string key="type">Feature</string>
                  <string key="id"><xsl:value-of select="$thisPlace/@xml:id"/></string>
                  <xsl:variable name="gjGeometry" as="xs:string" 
                    select="concat('{', $thisPlace/location[@type='GeoJSON'][1]/geo[1], '}')"/>
                  <xsl:variable name="gjGeomObj" select="json-to-xml($gjGeometry)"/>
                  <xsl:sequence select="$gjGeomObj/*:map/*"/>
                  <map key="properties">
                    <string key="name"><xsl:apply-templates select="$thisPlace/placeName" mode="xhtml5"/></string>
                    <string key="desc"><xsl:apply-templates select="$thisPlace/desc[1]" mode="xhtml5"/></string>
                    <array key="links">
                      <xsl:for-each select="$thisPlace/desc[2]/list/item/ptr">
                        <string><xsl:value-of select="@target"/></string>
                      </xsl:for-each>
                    </array>
<!--  Now taxonomies and categories.        -->
                    <xsl:variable name="thisFeatureCategories" select="for $c in distinct-values(($thisPlace/@corresp/tokenize(., '\s+'))) return substring-after($c, '#')"/>
                    <xsl:variable name="thisFeatureTaxonomies" select="$root//taxonomy[child::category[@xml:id=$thisFeatureCategories]]"/>
<!--        DONE TO HERE!!!!! -->
                  </map>
                </map>
              </xsl:for-each>
          </array>
        </map>
      </xsl:variable>
      <xsl:result-document  href="{$outputPath}">
        <xsl:value-of select="xml-to-json($xmlStructure, map{'indent': true()})"/>
      </xsl:result-document>

<!--      Now the GeoJSON. -->
      <xsl:result-document href="{$outputPath}" format="json">
        
        <xsl:variable name="places" select="//text/body/descendant::place[location]"/>
       
          
        <xsl:for-each select="$places[@xml:id != 'holMap']">
          <xsl:variable name="thisPlace" select="."/>
          
          
<!--  Now taxonomies and categories.        -->
          <xsl:variable name="thisFeatureCategories" select="for $c in distinct-values(($thisPlace/@corresp/tokenize(., '\s+'))) return substring-after($c, '#')"/>
          <xsl:variable name="thisFeatureTaxonomies" select="$root//taxonomy[child::category[@xml:id=$thisFeatureCategories]]"/>
          
<!--   CONVERTED TO HERE!!!!       -->
          
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
                <xsl:if test="desc">
                  <xsl:text>, "desc": </xsl:text><xsl:value-of select="concat($quot, hcmc:escapeForJSON(desc), $quot)"/>
                </xsl:if>
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
  
  <xsl:template match="p" mode="serializedXhtml">
    &lt;div class="p"&gt;<xsl:apply-templates mode="#current"/>&lt;/div&gt;
  </xsl:template>
  
<!-- For inline elements, we need to avoid adding extra space before or after the element, so 
     the template is all on one line.-->
  <xsl:template match="title[@level='m' or @level='j']" mode="serializedXhtml">&lt;em&gt;<xsl:apply-templates mode="#current"/>&lt;/em&gt;</xsl:template>
  
  <xsl:template match="title[@level='a'] | q" mode="serializedXhtml">&lt;q&gt;<xsl:apply-templates mode="#current"/>&lt;/q&gt;</xsl:template>
  
  <xsl:template match="ref[@target]" mode="serializedXhtml">&lt;a href="<xsl:value-of select="@target"/>"&gt;<xsl:apply-templates mode="#current"/>&lt;/a&gt;</xsl:template>
  
  <xsl:template match="list" mode="serializedXhtml">
    &lt;ul&gt;<xsl:apply-templates mode="#current"/>&lt;/ul&gt;
  </xsl:template>
  
  <xsl:template match="item" mode="serializedXhtml">
    &lt;li&gt;<xsl:apply-templates mode="#current"/>&lt;/li&gt;
  </xsl:template>
  
  <xsl:template match="graphic" mode="serializedXhtml">
    &lt;a href="<xsl:apply-templates select="@url" mode="#current"/>" target="_blank"&gt;&lt;img src="<xsl:apply-templates select="@url" mode="#current"/>" alt="<xsl:value-of select="@url"/>"/&gt;&lt;/a&gt;
  </xsl:template>
    
  <xsl:template match="lb" mode="serializedXhtml">
    &lt;br/&gt;
  </xsl:template>
    
</xsl:stylesheet>